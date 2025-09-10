import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const listByProfile = query({
  args: { profileId: v.id('profiles'), active: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query('market_members').withIndex('by_profile', (x: any) => x.eq('profileId', args.profileId));
    const items = await q.collect();
    return items.filter((i: any) => (args.active === undefined ? true : i.active === args.active));
  },
});

export const listByMarket = query({
  args: { marketId: v.id('markets'), active: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query('market_members').withIndex('by_market', (x: any) => x.eq('marketId', args.marketId));
    const items = await q.collect();
    return items.filter((i: any) => (args.active === undefined ? true : i.active === args.active));
  },
});

// Batch query: list active memberships for many profiles
export const listActiveByProfiles = query({
  args: { profileIds: v.array(v.id('profiles')) },
  handler: async (ctx, args) => {
    const results: any[] = [];
    for (const profileId of args.profileIds) {
      const items = await ctx.db
        .query('market_members')
        .withIndex('by_profile', (q: any) => q.eq('profileId', profileId))
        .collect();
      for (const it of items) {
        if (it.active) results.push(it);
      }
    }
    return results;
  },
});

export const hasAccess = query({
  args: { profileId: v.id('profiles'), marketId: v.id('markets') },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query('market_members')
      .withIndex('by_market_profile', (q) => q.eq('marketId', args.marketId).eq('profileId', args.profileId))
      .unique();
    return !!(item && item.active);
  },
});

export const assign = mutation({
  args: { profileId: v.id('profiles'), marketId: v.id('markets') },
  handler: async (ctx, args) => {
    // ensure profile and market exist
    const p = await ctx.db.get(args.profileId);
    if (!p) throw new Error('Không tìm thấy thành viên');
    const m = await ctx.db.get(args.marketId);
    if (!m) throw new Error('Không tìm thấy chợ');

    const existed = await ctx.db
      .query('market_members')
      .withIndex('by_market_profile', (q) => q.eq('marketId', args.marketId).eq('profileId', args.profileId))
      .unique();
    // Enforce 1-1: only one active manager per market
    const others = await ctx.db
      .query('market_members')
      .withIndex('by_market', (q) => q.eq('marketId', args.marketId))
      .collect();
    for (const o of others) {
      if (o.active && String((o.profileId as any).id ?? o.profileId) !== String((args.profileId as any).id ?? args.profileId)) {
        await ctx.db.patch(o._id, { active: false });
      }
    }
    if (existed) {
      await ctx.db.patch(existed._id, { active: true });
      return existed._id;
    }
    const id = await ctx.db.insert('market_members', {
      marketId: args.marketId,
      profileId: args.profileId,
      active: true,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const unassign = mutation({
  args: { profileId: v.id('profiles'), marketId: v.id('markets') },
  handler: async (ctx, args) => {
    const existed = await ctx.db
      .query('market_members')
      .withIndex('by_market_profile', (q) => q.eq('marketId', args.marketId).eq('profileId', args.profileId))
      .unique();
    if (!existed) return null;
    await ctx.db.patch(existed._id, { active: false });
    return existed._id;
  },
});
