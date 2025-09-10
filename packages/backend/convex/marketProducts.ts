import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const listByMarket = query({
  args: { marketId: v.id('markets'), active: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query('market_products').withIndex('by_market', (x: any) => x.eq('marketId', args.marketId));
    const items = await q.collect();
    return items.filter((i: any) => (args.active === undefined ? true : i.active === args.active));
  },
});

export const add = mutation({
  args: { marketId: v.id('markets'), productId: v.id('products'), unitId: v.id('units') },
  handler: async (ctx, args) => {
    // validate existence
    const [m, p, u] = await Promise.all([
      ctx.db.get(args.marketId),
      ctx.db.get(args.productId),
      ctx.db.get(args.unitId),
    ]);
    if (!m) throw new Error('Không tìm thấy chợ');
    if (!p) throw new Error('Không tìm thấy sản phẩm');
    if (!u) throw new Error('Không tìm thấy đơn vị');

    const existed = await ctx.db
      .query('market_products')
      .withIndex('by_market_product', (q) => q.eq('marketId', args.marketId).eq('productId', args.productId))
      .unique();
    if (existed) {
      await ctx.db.patch(existed._id, { unitId: args.unitId, active: true });
      return existed._id;
    }
    return await ctx.db.insert('market_products', {
      marketId: args.marketId,
      productId: args.productId,
      unitId: args.unitId,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { marketId: v.id('markets'), productId: v.id('products') },
  handler: async (ctx, args) => {
    const existed = await ctx.db
      .query('market_products')
      .withIndex('by_market_product', (q) => q.eq('marketId', args.marketId).eq('productId', args.productId))
      .unique();
    if (!existed) return null;
    await ctx.db.patch(existed._id, { active: false });
    return existed._id;
  },
});

export const listByProduct = query({
  args: { productId: v.id('products'), active: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query('market_products').withIndex('by_product', (x: any) => x.eq('productId', args.productId));
    const items = await q.collect();
    return items.filter((i: any) => (args.active === undefined ? true : i.active === args.active));
  },
});

export const setForMarket = mutation({
  args: {
    marketId: v.id('markets'),
    items: v.array(v.object({ productId: v.id('products'), unitId: v.id('units') })),
  },
  handler: async (ctx, args) => {
    // Load existing
    const existing = await ctx.db
      .query('market_products')
      .withIndex('by_market', (q) => q.eq('marketId', args.marketId))
      .collect();

    const incomingMap = new Map<string, { productId: any; unitId: any }>();
    for (const it of args.items) incomingMap.set((it.productId as any).id ?? (it.productId as any), it);

    let added = 0, updated = 0, deactivated = 0;

    // Deactivate missing and update unit if changed
    for (const ex of existing) {
      const key = (ex.productId as any).id ?? (ex.productId as any);
      const incoming = incomingMap.get(key);
      if (!incoming) {
        if (ex.active) {
          await ctx.db.patch(ex._id, { active: false });
          deactivated++;
        }
      } else {
        // Ensure active and correct unit
        const shouldUnit = (incoming.unitId as any).id ?? (incoming.unitId as any);
        const currentUnit = (ex.unitId as any).id ?? (ex.unitId as any);
        const patch: any = {};
        if (!ex.active) patch.active = true;
        if (currentUnit !== shouldUnit) patch.unitId = incoming.unitId;
        if (Object.keys(patch).length) {
          await ctx.db.patch(ex._id, patch);
          updated++;
        }
      }
    }

    // Add new ones
    const existingSet = new Set(existing.map((ex: any) => (ex.productId as any).id ?? (ex.productId as any)));
    for (const it of args.items) {
      const k = (it.productId as any).id ?? (it.productId as any);
      if (!existingSet.has(k)) {
        await ctx.db.insert('market_products', {
          marketId: args.marketId,
          productId: it.productId,
          unitId: it.unitId,
          active: true,
          createdAt: Date.now(),
        });
        added++;
      }
    }

    return { added, updated, deactivated };
  },
});
