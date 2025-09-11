import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    addressJson: v.object({
      provinceCode: v.optional(v.string()),
      districtCode: v.optional(v.string()),
      wardCode: v.optional(v.string()),
      detail: v.optional(v.string()),
    }),
    order: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("markets", {
      name: args.name,
      addressJson: args.addressJson,
      order: args.order ?? 0,
      active: args.active ?? true,
    });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("markets"),
    name: v.optional(v.string()),
    addressJson: v.optional(
      v.object({
        provinceCode: v.optional(v.string()),
        districtCode: v.optional(v.string()),
        wardCode: v.optional(v.string()),
        detail: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.addressJson !== undefined) patch.addressJson = args.addressJson;
    await ctx.db.patch(args.id, patch);
    return await ctx.db.get(args.id);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("markets"), active: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { active: args.active });
    return { success: true };
  },
});

export const reorder = mutation({
  args: {
    items: v.array(
      v.object({ id: v.id("markets"), order: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    for (const it of args.items) {
      await ctx.db.patch(it.id, { order: it.order });
    }
    return { success: true };
  },
});

export const listBrief = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const rows = args.activeOnly
      ? await ctx.db
          .query("markets")
          .withIndex("by_active", (qi) => qi.eq("active", true))
          .collect()
      : await ctx.db.query("markets").collect();
    return rows.map((m) => ({
      _id: m._id,
      name: m.name,
      addressJson: m.addressJson,
      active: m.active,
      order: m.order,
    }));
  },
});

export const getFull = query({
  args: { id: v.id("markets"), recentLimit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const market = await ctx.db.get(args.id);
    if (!market) return null;
    const assigns = await ctx.db
      .query("marketAssignments")
      .withIndex("by_marketId", (q) => q.eq("marketId", args.id))
      .collect();
    const members = await Promise.all(assigns.map((a) => ctx.db.get(a.memberId)));
    const recentSurveysAll = await ctx.db
      .query("surveys")
      .withIndex("by_marketId", (q) => q.eq("marketId", args.id))
      .collect();
    recentSurveysAll.sort((a, b) => b._creationTime - a._creationTime);
    const limit = args.recentLimit ?? 10;
    const recentSurveys = recentSurveysAll.slice(0, limit);
    const memberMap = new Map(
      (await Promise.all(recentSurveys.map((s) => ctx.db.get(s.memberId))))
        .filter(Boolean)
        .map((m) => [m!._id, m!])
    );
    return {
      market,
      assignedMembers: members.filter(Boolean),
      recentSurveys: recentSurveys.map((s) => ({
        _id: s._id,
        surveyDay: s.surveyDay,
        memberId: s.memberId,
        memberName: memberMap.get(s.memberId)?._id ? memberMap.get(s.memberId)!.name : null,
      })),
    };
  },
});
