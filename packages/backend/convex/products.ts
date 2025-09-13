import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listBrief = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const rows = args.activeOnly
      ? await ctx.db
          .query("products")
          .withIndex("by_active", (qi) => qi.eq("active", true))
          .collect()
      : await ctx.db.query("products").collect();
    rows.sort((a, b) => a.order - b.order);
    return rows;
  },
});

export const listWithUnits = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const products = await (args.activeOnly
      ? ctx.db
          .query("products")
          .withIndex("by_active", (qi) => qi.eq("active", true))
          .collect()
      : ctx.db.query("products").collect());
    products.sort((a, b) => a.order - b.order);
    const unitIds = Array.from(new Set(products.map((p) => p.unitId)));
    const units = await Promise.all(unitIds.map((id) => ctx.db.get(id)));
    const unitMap = new Map(units.filter(Boolean).map((u) => [u!._id, u!]));
    return products.map((p) => ({
      ...p,
      unit: unitMap.get(p.unitId) || null,
    }));
  },
});

export const create = mutation({
  args: { name: v.string(), unitId: v.id("units"), note: v.optional(v.string()), order: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const dup = await ctx.db
      .query("products")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (dup) throw new Error("Product name already exists");
    const id = await ctx.db.insert("products", {
      name: args.name,
      unitId: args.unitId,
      note: args.note,
      order: args.order ?? 0,
      active: true,
    });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    unitId: v.optional(v.id("units")),
    note: v.optional(v.string()),
    order: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.unitId !== undefined) patch.unitId = args.unitId;
    if (args.note !== undefined) patch.note = args.note;
    if (args.order !== undefined) patch.order = args.order;
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.id, patch);
    return await ctx.db.get(args.id);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("products"), active: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { active: args.active });
    return { success: true };
  },
});

export const safeDelete = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    // Collect references across dependent tables for better UX
    // 1) surveyItems
    const surveyItems = await ctx.db
      .query("surveyItems")
      .filter((q) => q.eq(q.field("productId"), args.id))
      .collect();

    const surveyItemsCount = surveyItems.length;
    let surveyItemSamples: any[] = [];
    if (surveyItemsCount > 0) {
      const sampleItems = surveyItems.slice(0, 3);
      const surveyIds = Array.from(new Set(sampleItems.map((s) => s.surveyId)));
      const surveys = await Promise.all(surveyIds.map((id) => ctx.db.get(id)));
      const surveyMap = new Map(surveys.filter(Boolean).map((s) => [s!._id, s!]));
      const marketIds = Array.from(new Set(surveys.filter(Boolean).map((s: any) => s!.marketId)));
      const markets = await Promise.all(marketIds.map((mid) => ctx.db.get(mid)));
      const marketMap = new Map(markets.filter(Boolean).map((m) => [m!._id, m!]));
      surveyItemSamples = sampleItems.map((it) => {
        const survey: any | null = surveyMap.get(it.surveyId) ?? null;
        const market: any | null = survey ? marketMap.get(survey.marketId) ?? null : null;
        return {
          surveyId: it.surveyId,
          surveyDay: survey?.surveyDay,
          marketId: survey?.marketId,
          marketName: market?.name,
        };
      });
    }

    // 2) reportItems (immutable snapshots)
    const reportItems = await ctx.db
      .query("reportItems")
      .filter((q) => q.eq(q.field("productId"), args.id))
      .collect();
    const reportItemsCount = reportItems.length;
    const reportItemSamples = reportItems.slice(0, 3).map((it) => ({
      reportId: (it as any).reportId,
      surveyDay: (it as any).surveyDay,
      marketId: (it as any).marketId,
      marketName: (it as any).marketName,
    }));

    const hasRefs = surveyItemsCount > 0 || reportItemsCount > 0;
    if (hasRefs) {
      return {
        success: false,
        code: "REFERENCED",
        message: "Không thể xóa sản phẩm: đang được tham chiếu bởi các bản ghi khác",
        refs: [
          ...(surveyItemsCount
            ? [
                {
                  table: "surveyItems",
                  count: surveyItemsCount,
                  samples: surveyItemSamples,
                },
              ]
            : []),
          ...(reportItemsCount
            ? [
                {
                  table: "reportItems",
                  count: reportItemsCount,
                  samples: reportItemSamples,
                },
              ]
            : []),
        ],
      } as const;
    }

    // Safe to delete
    await ctx.db.delete(args.id);
    return { success: true } as const;
  },
});

export const reorder = mutation({
  args: { items: v.array(v.object({ id: v.id("products"), order: v.number() })) },
  handler: async (ctx, args) => {
    for (const it of args.items) {
      await ctx.db.patch(it.id, { order: it.order });
    }
    return { success: true };
  },
});

// Reference summary for UI helper text
export const refSummary = query({
  args: { id: v.id("products"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(0, Math.min(args.limit ?? 3, 50));

    const surveyItems = await ctx.db
      .query("surveyItems")
      .filter((q) => q.eq(q.field("productId"), args.id))
      .collect();
    const surveyItemsCount = surveyItems.length;
    const surveyItemSamples = surveyItems.slice(0, limit).map((it) => ({ surveyId: it.surveyId }));

    const reportItems = await ctx.db
      .query("reportItems")
      .filter((q) => q.eq(q.field("productId"), args.id))
      .collect();
    const reportItemsCount = reportItems.length;
    const reportItemSamples = reportItems.slice(0, limit).map((it) => ({ reportId: (it as any).reportId }));

    return {
      refs: [
        { table: "surveyItems", count: surveyItemsCount, samples: surveyItemSamples },
        { table: "reportItems", count: reportItemsCount, samples: reportItemSamples },
      ],
    } as const;
  },
});
