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
  args: { id: v.id("products"), name: v.optional(v.string()), unitId: v.optional(v.id("units")), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.unitId !== undefined) patch.unitId = args.unitId;
    if (args.note !== undefined) patch.note = args.note;
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
    const anyItem = await ctx.db
      .query("surveyItems")
      .filter((q) => q.eq(q.field("productId"), args.id))
      .first();
    if (anyItem) throw new Error("Cannot delete product: referenced by survey items");
    await ctx.db.delete(args.id);
    return { success: true };
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
