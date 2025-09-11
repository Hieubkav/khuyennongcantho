import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const assign = mutation({
  args: { marketId: v.id("markets"), memberId: v.id("members") },
  handler: async (ctx, args) => {
    const exists = await ctx.db
      .query("marketAssignments")
      .withIndex("by_marketId", (q) => q.eq("marketId", args.marketId))
      .filter((q) => q.eq(q.field("memberId"), args.memberId))
      .first();
    if (exists) return exists;
    const id = await ctx.db.insert("marketAssignments", {
      marketId: args.marketId,
      memberId: args.memberId,
      order: 0,
      active: true,
    });
    return await ctx.db.get(id);
  },
});

export const unassign = mutation({
  args: { marketId: v.id("markets"), memberId: v.id("members") },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("marketAssignments")
      .withIndex("by_marketId", (q) => q.eq("marketId", args.marketId))
      .filter((q) => q.eq(q.field("memberId"), args.memberId))
      .first();
    if (!row) return { success: true };
    await ctx.db.delete(row._id);
    return { success: true };
  },
});

export const listByMarket = query({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    const assigns = await ctx.db
      .query("marketAssignments")
      .withIndex("by_marketId", (q) => q.eq("marketId", args.marketId))
      .collect();
    const members = await Promise.all(assigns.map((a) => ctx.db.get(a.memberId)));
    return members.filter(Boolean);
  },
});

export const listByMember = query({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    const assigns = await ctx.db
      .query("marketAssignments")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
    const markets = await Promise.all(assigns.map((a) => ctx.db.get(a.marketId)));
    return markets.filter(Boolean);
  },
});

