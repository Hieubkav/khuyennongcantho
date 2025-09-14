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
      .query("members")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (existing) throw new Error("Username already exists");
    const id = await ctx.db.insert("members", {
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

export const updateProfile = mutation({
  args: {
    id: v.id("members"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.phone !== undefined) patch.phone = args.phone;
    await ctx.db.patch(args.id, patch);
    return await ctx.db.get(args.id);
  },
});

export const changePassword = mutation({
  args: {
    id: v.id("members"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { passwordHash: args.passwordHash });
    return { success: true };
  },
});

export const getByUsernameWithHash = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("members")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (!row) return null as any;
    return {
      _id: row._id,
      username: row.username,
      passwordHash: row.passwordHash,
      name: row.name,
      active: row.active,
    } as const;
  },
});

export const toggleActive = mutation({
  args: { id: v.id("members"), active: v.boolean() },
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
          .query("members")
          .withIndex("by_active", (qi) => qi.eq("active", true))
          .collect()
      : await ctx.db.query("members").collect();
    return rows.map((r) => ({
      _id: r._id,
      name: r.name,
      username: r.username,
      phone: r.phone ?? null,
      active: r.active,
      order: r.order,
    }));
  },
});

export const getFull = query({
  args: { id: v.id("members"), recentLimit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (!member) return null;
    const assigns = await ctx.db
      .query("marketAssignments")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.id))
      .collect();
    const markets = await Promise.all(
      assigns.map((a) => ctx.db.get(a.marketId))
    );
    const recentSurveysAll = await ctx.db
      .query("surveys")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.id))
      .collect();
    recentSurveysAll.sort((a, b) => b._creationTime - a._creationTime);
    const limit = args.recentLimit ?? 10;
    const recentSurveys = recentSurveysAll.slice(0, limit);
    const marketDocs = await Promise.all(
      recentSurveys.map((s) => ctx.db.get(s.marketId))
    );
    const marketMap = new Map(
      marketDocs.filter(Boolean).map((m) => [m!._id, m!])
    );
    return {
      member,
      assignedMarkets: markets.filter(Boolean),
      recentSurveys: recentSurveys.map((s) => ({
        _id: s._id,
        surveyDay: s.surveyDay,
        marketId: s.marketId,
        marketName: marketMap.get(s.marketId)?.name ?? null,
      })),
    };
  },
});

export const markets = query({
  args: { memberId: v.id("members"), activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const assigns = await ctx.db
      .query("marketAssignments")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
    const marketDocs = await Promise.all(assigns.map((a) => ctx.db.get(a.marketId)));
    return marketDocs
      .filter((m) => !!m && (!args.activeOnly || m!.active))
      .map((m) => ({
        _id: m!._id,
        name: m!.name,
        addressJson: m!.addressJson,
        active: m!.active,
        order: m!.order,
      }));
  },
});

export const surveysInRange = query({
  args: { memberId: v.id("members"), fromDay: v.string(), toDay: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("surveys")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
    const filtered = rows
      .filter((s) => s.surveyDay >= args.fromDay && s.surveyDay <= args.toDay)
      .sort((a, b) => b._creationTime - a._creationTime);

    // Enrich with market name for UI convenience
    const marketDocs = await Promise.all(filtered.map((s) => ctx.db.get(s.marketId)));
    const marketMap = new Map(marketDocs.filter(Boolean).map((m) => [m!._id, m!]));

    return filtered.map((s) => ({
      _id: s._id,
      surveyDay: s.surveyDay,
      marketId: s.marketId,
      marketName: marketMap.get(s.marketId)?.name ?? null,
      active: s.active,
    }));
  },
});
