import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

function validateCode(code: string): string {
  const trimmed = code.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > 32) {
    throw new Error('Mã đơn vị phải từ 1-32 ký tự');
  }
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    throw new Error('Mã chỉ gồm chữ thường, số, dấu gạch ngang');
  }
  return trimmed;
}

function validateName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 128) {
    throw new Error('Tên phải từ 1-128 ký tự');
  }
  return trimmed;
}

export const list = query({
  args: {
    active: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    let q: any = ctx.db.query('units');

    if (args.active !== undefined) {
      q = q.withIndex('by_active', (q: any) => q.eq('active', args.active));
    }

    if (args.cursor) {
      q = q.cursor(args.cursor);
    }

    const results = await q.order('asc').take(limit + 1);

    let cursor = null;
    if (results.length > limit) {
      cursor = results[limit - 1]._id;
      results.pop();
    }

    return { units: results, cursor };
  },
});

export const getById = query({
  args: { id: v.id('units') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: { code: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const code = validateCode(args.code);
    const name = validateName(args.name);

    const existed = await ctx.db.query('units').withIndex('by_code', (q) => q.eq('code', code)).unique();
    if (existed) throw new Error(`Mã đơn vị "${code}" đã tồn tại`);

    const id = await ctx.db.insert('units', { code, name, active: true, createdAt: Date.now() });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('units'),
    code: v.optional(v.string()),
    name: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const u = await ctx.db.get(args.id);
    if (!u) throw new Error('Không tìm thấy đơn vị');

    const patch: any = {};
    if (args.code !== undefined) {
      const code = validateCode(args.code);
      if (code !== u.code) {
        const existed = await ctx.db.query('units').withIndex('by_code', (q) => q.eq('code', code)).unique();
        if (existed) throw new Error(`Mã đơn vị "${code}" đã tồn tại`);
      }
      patch.code = code;
    }
    if (args.name !== undefined) patch.name = validateName(args.name);
    if (args.active !== undefined) {
      if (u.active && args.active === false) {
        // Do not allow disabling the last active unit
        const activeCount = (await ctx.db.query('units').withIndex('by_active', (q: any) => q.eq('active', true)).collect()).length;
        if (activeCount <= 1) throw new Error('Không thể vô hiệu hóa đơn vị cuối cùng');
      }
      patch.active = args.active;
    }
    if (Object.keys(patch).length > 0) await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const deleteUnit = mutation({
  args: { id: v.id('units') },
  handler: async (ctx, args) => {
    const u = await ctx.db.get(args.id);
    if (!u) throw new Error('Không tìm thấy đơn vị');

    // Prevent deleting the last active unit
    if (u.active) {
      const activeCount = (await ctx.db.query('units').withIndex('by_active', (q: any) => q.eq('active', true)).collect()).length;
      if (activeCount <= 1) throw new Error('Không thể xoá đơn vị cuối cùng đang hoạt động');
    }

    // Check references: products.defaultUnitId
    const refProduct = await ctx.db
      .query('products')
      .withIndex('by_defaultUnit', (q: any) => q.eq('defaultUnitId', args.id))
      .first();
    if (refProduct) throw new Error('Đơn vị đang được dùng bởi sản phẩm. Hãy đổi đơn vị cho sản phẩm hoặc vô hiệu hóa đơn vị.');

    // Check market_products (no index by unitId) -> scan
    const anyMarketProduct = (await ctx.db.query('market_products').collect()).some((mp: any) => String(mp.unitId) === String(args.id));
    if (anyMarketProduct) throw new Error('Đơn vị đang được dùng trong cấu hình chợ. Hãy gỡ liên kết hoặc vô hiệu hoá đơn vị.');

    // Check prices (no index by unitId) -> scan
    const anyPrice = (await ctx.db.query('prices').collect()).some((p: any) => String(p.unitId) === String(args.id));
    if (anyPrice) throw new Error('Đơn vị đang được dùng trong dữ liệu giá. Không thể xoá, chỉ có thể vô hiệu hoá.');

    // Check price_rounds items (array contains unitId) -> scan
    const anyRound = (await ctx.db.query('price_rounds').collect()).some((r: any) =>
      (r.items as any[]).some((it: any) => String(it.unitId) === String(args.id))
    );
    if (anyRound) throw new Error('Đơn vị đang được cấu hình trong đợt giá. Không thể xoá, chỉ có thể vô hiệu hoá.');

    await ctx.db.delete(args.id);
    return args.id;
  },
});

