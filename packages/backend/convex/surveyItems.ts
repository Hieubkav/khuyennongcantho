import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const autosave = mutation({
  args: {
    id: v.id("surveyItems"),
    price: v.optional(v.union(v.number(), v.null())),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    const patch: Record<string, any> = {};
    if (args.price !== undefined) patch.price = args.price as any;
    if (args.note !== undefined) patch.note = args.note;
    await ctx.db.patch(args.id, patch);
    await ctx.db.patch(item.surveyId, { lastUpdatedAt: Date.now() });
    return { success: true };
  },
});

export const listWithProductUnit = query({
  args: { surveyId: v.id("surveys") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("surveyItems")
      .withIndex("by_surveyId", (q) => q.eq("surveyId", args.surveyId))
      .collect();
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));
    const unitIds = Array.from(new Set(products.filter(Boolean).map((p) => p!.unitId)));
    const units = await Promise.all(unitIds.map((id) => ctx.db.get(id)));
    const productMap = new Map(products.filter(Boolean).map((p) => [p!._id, p!]));
    const unitMap = new Map(units.filter(Boolean).map((u) => [u!._id, u!]));
    return items
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
  },
});

export const clearPrice = mutation({
  args: { id: v.id("surveyItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return { success: true };
    await ctx.db.patch(args.id, { price: null });
    await ctx.db.patch(item.surveyId, { lastUpdatedAt: Date.now() });
    return { success: true };
  },
});

export const bulkClear = mutation({
  args: {
    surveyId: v.id("surveys"),
    productIds: v.optional(v.array(v.id("products"))),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("surveyItems")
      .withIndex("by_surveyId", (q) => q.eq("surveyId", args.surveyId))
      .collect();
    for (const it of items) {
      if (args.productIds && !args.productIds.find((id) => id === it.productId)) continue;
      await ctx.db.patch(it._id, { price: null });
    }
    await ctx.db.patch(args.surveyId, { lastUpdatedAt: Date.now() });
    return { success: true };
  },
});
