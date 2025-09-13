import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    username: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    order: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (existing) throw new Error("Username already exists");
    const id = await ctx.db.insert("admins", {
      username: args.username,
      passwordHash: args.passwordHash,
      name: args.name,
      phone: args.phone,
      order: args.order ?? 0,
      active: args.active ?? true,
    });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("admins"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    order: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.order !== undefined) patch.order = args.order;
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.id, patch);
    return await ctx.db.get(args.id);
  },
});

export const changePassword = mutation({
  args: { id: v.id("admins"), passwordHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { passwordHash: args.passwordHash });
    return { success: true };
  },
});

export const toggleActive = mutation({
  args: { id: v.id("admins"), active: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { active: args.active });
    return { success: true };
  },
});

export const listBrief = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const rows = args.activeOnly
      ? await ctx.db
          .query("admins")
          .withIndex("by_active", (qi) => qi.eq("active", true))
          .collect()
      : await ctx.db.query("admins").collect();
    return rows.map((r) => ({
      _id: r._id,
      username: r.username,
      name: r.name,
      phone: r.phone ?? null,
      active: r.active,
      order: r.order,
    }));
  },
});

export const getByUsernameWithHash = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (!row) return null;
    return {
      _id: row._id,
      username: row.username,
      passwordHash: row.passwordHash,
      name: row.name,
      active: row.active,
    } as const;
  },
});

export const deleteById = mutation({
  args: { id: v.id("admins") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
