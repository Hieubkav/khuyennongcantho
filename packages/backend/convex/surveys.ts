import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function todayLocalISODate(): string {
  const now = new Date();
  const tzOffsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + tzOffsetMs);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const createForMarket = mutation({
  args: {
    marketId: v.id("markets"),
    memberId: v.id("members"),
    surveyDay: v.optional(v.string()),
    note: v.optional(v.string()),
    copyFromPrevious: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const surveyDay = args.surveyDay ?? todayLocalISODate();
    const surveyId = await ctx.db.insert("surveys", {
      marketId: args.marketId,
      memberId: args.memberId,
      surveyDay,
      note: args.note,
      lastUpdatedAt: Date.now(),
      order: 0,
      active: true,
    });

    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    products.sort((a, b) => a.order - b.order);

    let previousPrices = new Map<string, number | null>();
    if (args.copyFromPrevious) {
      const prev = await ctx.db
        .query("surveys")
        .withIndex("by_marketId", (q) => q.eq("marketId", args.marketId))
        .collect();
      prev.sort((a, b) => b._creationTime - a._creationTime);
      const last = prev[0];
      if (last) {
        const items = await ctx.db
          .query("surveyItems")
          .withIndex("by_surveyId", (q) => q.eq("surveyId", last._id))
          .collect();
        for (const it of items) previousPrices.set(it.productId as any, it.price as any);
      }
    }

    for (const p of products) {
      const price = previousPrices.get(p._id as any) ?? null;
      await ctx.db.insert("surveyItems", {
        surveyId,
        productId: p._id,
        price: price as any,
        note: undefined,
        order: p.order,
        active: true,
      });
    }
    return await ctx.db.get(surveyId);
  },
});

export const getFull = query({
  args: { id: v.id("surveys") },
  handler: async (ctx, args) => {
    const survey = await ctx.db.get(args.id);
    if (!survey) return null;
    const market = await ctx.db.get(survey.marketId);
    const member = await ctx.db.get(survey.memberId);
    const items = await ctx.db
      .query("surveyItems")
      .withIndex("by_surveyId", (q) => q.eq("surveyId", args.id))
      .collect();
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));
    const unitIds = Array.from(new Set(products.filter(Boolean).map((p) => p!.unitId)));
    const units = await Promise.all(unitIds.map((id) => ctx.db.get(id)));
    const productMap = new Map(products.filter(Boolean).map((p) => [p!._id, p!]));
    const unitMap = new Map(units.filter(Boolean).map((u) => [u!._id, u!]));
    const itemsExpanded = items
      .sort((a, b) => a.order - b.order)
      .map((it) => {
        const prod = productMap.get(it.productId);
        const unit = prod ? unitMap.get(prod.unitId) : null;
        return {
          _id: it._id,
          productId: it.productId,
          productName: prod ? prod.name : null,
          unit: unit ? { _id: unit._id, name: unit.name, abbr: unit.abbr ?? null } : null,
          price: it.price,
          note: it.note ?? null,
          order: it.order,
        };
      });
    return { survey, market, member, items: itemsExpanded };
  },
});

export const listMineByRange = query({
  args: { memberId: v.id("members"), fromDay: v.string(), toDay: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("surveys")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
    return rows
      .filter((s) => s.surveyDay >= args.fromDay && s.surveyDay <= args.toDay)
      .sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const deleteCascade = mutation({
  args: { id: v.id("surveys") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("surveyItems")
      .withIndex("by_surveyId", (q) => q.eq("surveyId", args.id))
      .collect();
    for (const it of items) await ctx.db.delete(it._id);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const lastInMarket = query({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("surveys")
      .withIndex("by_marketId", (q) => q.eq("marketId", args.marketId))
      .collect();
    rows.sort((a, b) => b._creationTime - a._creationTime);
    return rows[0] ?? null;
  },
});

export const countFilled = query({
  args: { id: v.id("surveys") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("surveyItems")
      .withIndex("by_surveyId", (q) => q.eq("surveyId", args.id))
      .collect();
    const total = items.length;
    const filled = items.filter((it) => it.price !== null && it.price !== undefined).length;
    return { filled, total };
  },
});

// Admin listing: list surveys by date range, optional filters, expanded names
export const listByRange = query({
  args: {
    fromDay: v.string(),
    toDay: v.string(),
    marketId: v.optional(v.id("markets")),
    memberId: v.optional(v.id("members")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rows = await ctx.db
      .query("surveys")
      .withIndex("by_surveyDay", (q) => q.gte("surveyDay", args.fromDay))
      .collect();
    rows = rows.filter(
      (s) => s.surveyDay >= args.fromDay && s.surveyDay <= args.toDay
    );
    if (args.marketId) rows = rows.filter((s) => String(s.marketId) === String(args.marketId));
    if (args.memberId) rows = rows.filter((s) => String(s.memberId) === String(args.memberId));
    rows.sort((a, b) => b._creationTime - a._creationTime);
    const lim = args.limit ?? 200;
    rows = rows.slice(0, lim);
    const marketDocs = await Promise.all(rows.map((s) => ctx.db.get(s.marketId)));
    const memberDocs = await Promise.all(rows.map((s) => ctx.db.get(s.memberId)));
    return rows.map((s, i) => ({
      _id: s._id,
      surveyDay: s.surveyDay,
      marketId: s.marketId,
      memberId: s.memberId,
      marketName: marketDocs[i]?.name ?? null,
      memberName: memberDocs[i]?.name ?? null,
    }));
  },
});
