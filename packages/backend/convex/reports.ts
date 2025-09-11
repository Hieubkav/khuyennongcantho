import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function computeSummary(ctx: any, fromDay: string, toDay: string) {
  const surveys = await ctx.db
    .query("surveys")
    .withIndex("by_surveyDay", (q: any) => q.gte("surveyDay", fromDay))
    .collect();
  const ranged = surveys.filter((s: any) => s.surveyDay >= fromDay && s.surveyDay <= toDay);
  const byMarket = new Map<string, any[]>();
  for (const s of ranged) {
    const key = s.marketId as string;
    if (!byMarket.has(key)) byMarket.set(key, []);
    byMarket.get(key)!.push(s);
  }
  const result: any[] = [];
  for (const [_marketKey, list] of byMarket.entries()) {
    const marketId = list[0].marketId;
    const market = await ctx.db.get(marketId);
    const memberIdMap = new Map<string, any>();
    for (const s of list) memberIdMap.set(s.memberId.id, s.memberId);
    const members = await Promise.all(Array.from(memberIdMap.values()).map((id) => ctx.db.get(id)));
    const memberNames = members.filter(Boolean).map((m) => (m as any).name);
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
      marketId,
      marketName: market ? market.name : "",
      memberNames,
      surveyCount: list.length,
      filledCount,
    });
  }
  const includedSurveyIds = ranged.map((s: any) => s._id);
  return { summaryRows: result, includedSurveyIds };
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
    return await ctx.db.get(id);
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
