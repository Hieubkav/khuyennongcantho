import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function computeSummary(ctx: any, fromDay: string, toDay: string) {
  // Load all surveys in range
  const surveys = await ctx.db
    .query("surveys")
    .withIndex("by_surveyDay", (q: any) => q.gte("surveyDay", fromDay))
    .filter((q: any) => q.eq(q.field("active"), true))
    .collect();
  const ranged = surveys.filter((s: any) => s.surveyDay >= fromDay && s.surveyDay <= toDay);

  // Group surveys by market for quick lookup
  const byMarket = new Map<string, any[]>();
  // Collect survey timestamps per market for UI expand
  const timesByMarket = new Map<string, number[]>();
  for (const s of ranged) {
    const key = String(s.marketId);
    if (!byMarket.has(key)) byMarket.set(key, []);
    byMarket.get(key)!.push(s);
    const ts = (s as any).lastUpdatedAt ?? (s as any)._creationTime ?? 0;
    if (ts && ts > 0) {
      if (!timesByMarket.has(key)) timesByMarket.set(key, []);
      timesByMarket.get(key)!.push(ts);
    }
  }

  // Fetch all active markets to include markets with zero surveys
  const activeMarkets = await ctx.db
    .query("markets")
    .withIndex("by_active", (q: any) => q.eq("active", true))
    .collect();

  const result: any[] = [];
  for (const market of activeMarkets) {
    const list = byMarket.get(String(market._id)) ?? [];

    // Get assigned members for this market
    const assigns = await ctx.db
      .query("marketAssignments")
      .withIndex("by_marketId", (q: any) => q.eq("marketId", market._id))
      .collect();
    const assignedMembers = await Promise.all(assigns.map((a: any) => ctx.db.get(a.memberId)));
    const assignedNames = assignedMembers.filter(Boolean).map((m: any) => m.name);

    // Compute how many surveys are fully filled
    let filledCount = 0;
    for (const s of list) {
      const items = await ctx.db
        .query("surveyItems")
        .withIndex("by_surveyId", (q: any) => q.eq("surveyId", s._id))
        .collect();
      const total = items.length;
      const filled = items.filter((it: any) => it.price !== null && it.price !== undefined).length;
      if (total > 0 && filled === total) filledCount++;
    }

    result.push({
      marketId: market._id,
      marketName: market.name,
      memberNames: assignedNames,
      surveyCount: list.length,
      filledCount,
    });
  }

  const includedSurveyIds = ranged.map((s: any) => s._id);
  // Expose marketSurveyTimes for live summary view only (ignored by generateRange)
  const marketSurveyTimes: Record<string, number[]> = {};
  for (const [k, v] of timesByMarket.entries()) {
    // sort descending (newest first)
    marketSurveyTimes[k] = v.sort((a, b) => b - a);
  }
  return { summaryRows: result, includedSurveyIds, marketSurveyTimes };
}

export const summaryByMarketRange = query({
  args: { fromDay: v.string(), toDay: v.string() },
  handler: async (ctx, args) => {
    return await computeSummary(ctx, args.fromDay, args.toDay);
  },
});

export const generateRange = mutation({
  args: { fromDay: v.string(), toDay: v.string(), createdByAdminId: v.id("admins") },
  handler: async (ctx, args) => {
    const { summaryRows, includedSurveyIds } = await computeSummary(ctx, args.fromDay, args.toDay);
    const id = await ctx.db.insert("reports", {
      fromDay: args.fromDay,
      toDay: args.toDay,
      generatedAt: Date.now(),
      createdByAdminId: args.createdByAdminId,
      summaryRows,
      includedSurveyIds,
      order: 0,
      active: true,
    });
    const report = await ctx.db.get(id);

    // Build immutable item snapshots
    // For each included survey, fetch items and denormalize fields
    for (const sid of includedSurveyIds) {
      const survey = (await ctx.db.get(sid)) as any;
      if (!survey) continue;
      const [market, member] = (await Promise.all([
        ctx.db.get(survey.marketId as any),
        ctx.db.get(survey.memberId as any),
      ])) as any[];
      const items = await ctx.db
        .query("surveyItems")
        .withIndex("by_surveyId", (q: any) => q.eq("surveyId", sid))
        .collect();
      const productIds = Array.from(new Set(items.map((i: any) => i.productId)));
      const products = await Promise.all(productIds.map((pid) => ctx.db.get(pid)));
      const unitIds = Array.from(new Set(products.filter(Boolean).map((p: any) => p.unitId)));
      const units = await Promise.all(unitIds.map((uid) => ctx.db.get(uid)));
      const productMap = new Map(products.filter(Boolean).map((p: any) => [p._id, p]));
      const unitMap = new Map(units.filter(Boolean).map((u: any) => [u._id, u]));
      items.sort((a: any, b: any) => a.order - b.order);
      for (const it of items) {
        const prod = productMap.get(it.productId);
        const unit = prod ? unitMap.get(prod.unitId) : null;
        await ctx.db.insert("reportItems", {
          reportId: id,
          surveyId: sid,
          surveyDay: (survey as any).surveyDay,
          marketId: survey.marketId as any,
          marketName: market ? (market as any).name : "",
          memberId: survey.memberId as any,
          memberName: member ? (member as any).name : "",
          productId: it.productId,
          productName: prod ? (prod as any).name : "",
          unitName: unit ? (unit as any).name : undefined,
          unitAbbr: unit ? (unit as any).abbr ?? undefined : undefined,
          price: it.price as any,
          note: it.note ?? undefined,
          order: it.order,
        });
      }
    }

    return report;
  },
});

export const listBrief = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("reports")
      .withIndex("by_generatedAt", (q: any) => q.gte("generatedAt", 0))
      .collect();
    rows.sort((a: any, b: any) => b.generatedAt - a.generatedAt);
    const limit = args.limit ?? 50;
    return rows.slice(0, limit).map((r: any) => ({
      _id: r._id,
      fromDay: r.fromDay,
      toDay: r.toDay,
      generatedAt: r.generatedAt,
      active: r.active,
    }));
  },
});

export const getFull = query({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    return report ?? null;
  },
});

// List immutable report items; optionally filter by market
export const itemsByReport = query({
  args: { reportId: v.id("reports"), marketId: v.optional(v.id("markets")) },
  handler: async (ctx, args) => {
    let items: any[];
    if (args.marketId) {
      items = await ctx.db
        .query("reportItems")
        .withIndex("by_report_market", (q: any) => q.eq("reportId", args.reportId).eq("marketId", args.marketId))
        .collect();
    } else {
      items = await ctx.db
        .query("reportItems")
        .withIndex("by_reportId", (q: any) => q.eq("reportId", args.reportId))
        .collect();
    }
    items.sort((a: any, b: any) => a.order - b.order);
    return items;
  },
});

export const toggleActive = mutation({
  args: { id: v.id("reports"), active: v.boolean() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Không tìm thấy báo cáo");
    await ctx.db.patch(args.id, { active: args.active });
    return { success: true };
  },
});

export const update = mutation({
  args: { id: v.id("reports"), fromDay: v.string(), toDay: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Không tìm thấy báo cáo");
    await ctx.db.patch(args.id, { 
      fromDay: args.fromDay,
      toDay: args.toDay
    });
    return { success: true };
  },
});

// Permanently delete a report and all its snapshot items
export const remove = mutation({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return { success: true };
    // Delete all reportItems under this report
    const items = await ctx.db
      .query("reportItems")
      .withIndex("by_reportId", (q: any) => q.eq("reportId", args.id))
      .collect();
    for (const it of items) {
      await ctx.db.delete(it._id);
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Find an existing report by exact day range (if any)
export const findByRange = query({
  args: { fromDay: v.string(), toDay: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("reports")
      .withIndex("by_from_to", (q: any) => q.eq("fromDay", args.fromDay).eq("toDay", args.toDay))
      .collect();
    rows.sort((a: any, b: any) => b.generatedAt - a.generatedAt);
    return rows[0] ?? null;
  },
});
