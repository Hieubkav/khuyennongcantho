import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listBrief = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const rows = args.activeOnly
      ? await ctx.db
          .query("units")
          .withIndex("by_active", (qi) => qi.eq("active", true))
          .collect()
      : await ctx.db.query("units").collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: { name: v.string(), abbr: v.optional(v.string()), order: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const dup = await ctx.db
      .query("units")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (dup) throw new Error("Unit name already exists");
    const id = await ctx.db.insert("units", {
      name: args.name,
      abbr: args.abbr,
      order: args.order ?? 0,
      active: true,
    });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("units"),
    name: v.optional(v.string()),
    abbr: v.optional(v.string()),
    order: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.abbr !== undefined) patch.abbr = args.abbr;
    if (args.order !== undefined) patch.order = args.order;
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.id, patch);
    return await ctx.db.get(args.id);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("units"), active: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { active: args.active });
    return { success: true };
  },
});

export const safeDelete = mutation({
  args: { id: v.id("units") },
  handler: async (ctx, args) => {
    const productsUsing = await ctx.db
      .query("products")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.id))
      .collect();

    if (productsUsing.length > 0) {
      const productSamples = productsUsing.slice(0, 3).map((p) => ({ id: p._id, name: p.name }));
      return {
        success: false,
        code: "REFERENCED",
        message: "Không thể xóa đơn vị: đang được tham chiếu bởi các sản phẩm",
        refs: [
          {
            table: "products",
            count: productsUsing.length,
            samples: productSamples,
          },
        ],
      } as const;
    }

    await ctx.db.delete(args.id);
    return { success: true } as const;
  },
});

// Optional: summary API for UI to show dependency detail
export const refSummary = query({
  args: { id: v.id("units"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("products")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.id))
      .collect();
    const limit = Math.max(0, Math.min(args.limit ?? 5, 50));
    const sample = list.slice(0, limit).map((p) => ({ id: p._id, name: p.name }));
    return {
      products: {
        count: list.length,
        sample,
      },
    };
  },
});

export const reorder = mutation({
  args: {
    items: v.array(
      v.object({ id: v.id("units"), order: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    for (const it of args.items) {
      await ctx.db.patch(it.id, { order: it.order });
    }
    return { success: true };
  },
});

