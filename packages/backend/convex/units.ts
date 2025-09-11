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
  args: { id: v.id("units"), name: v.optional(v.string()), abbr: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.abbr !== undefined) patch.abbr = args.abbr;
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
    const inUse = await ctx.db
      .query("products")
      .withIndex("by_unitId", (q) => q.eq("unitId", args.id))
      .first();
    if (inUse) throw new Error("Cannot delete unit: referenced by products");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
