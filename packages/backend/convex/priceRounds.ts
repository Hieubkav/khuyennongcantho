import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

function todayInTzYYYYMMDD(timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  // en-CA gives YYYY-MM-DD
  return fmt.format(new Date());
}

export const create = mutation({
  args: {
    marketId: v.id('markets'),
    creatorId: v.id('profiles'),
    forDate: v.optional(v.string()), // YYYY-MM-DD (Asia/Ho_Chi_Minh)
    itemOverrides: v.optional(v.array(v.object({ productId: v.id('products'), unitId: v.id('units') }))),
  },
  handler: async (ctx, args) => {
    const market = await ctx.db.get(args.marketId);
    if (!market) throw new Error('Không tìm thấy chợ');

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error('Không tìm thấy profile');

    const date = args.forDate ?? todayInTzYYYYMMDD('Asia/Ho_Chi_Minh');

    // Ensure the market has at least one active manager
    const managers = await ctx.db
      .query('market_members')
      .withIndex('by_market', (q) => q.eq('marketId', args.marketId))
      .collect();
    const activeManagers = managers.filter((m: any) => m.active);
    if (activeManagers.length === 0) {
      throw new Error('Chợ chưa có thành viên quản lý. Hãy phân quyền trước khi tạo đợt.');
    }

    // If creator is a member, ensure they are assigned to this market
    if (creator.role === 'member') {
      const mine = await ctx.db
        .query('market_members')
        .withIndex('by_market_profile', (q) => q.eq('marketId', args.marketId).eq('profileId', args.creatorId))
        .unique();
      if (!mine || !mine.active) throw new Error('Bạn không có quyền tạo đợt cho chợ này');
    }

    // Ensure not already exists for same market/date in open status
    const existed = await ctx.db
      .query('price_rounds')
      .withIndex('by_market_date', (q) => q.eq('marketId', args.marketId).eq('forDate', date))
      .unique();
    if (existed && existed.status === 'open') {
      return existed._id; // idempotent
    }

    let items: Array<{ productId: any; unitId: any }> = [];
    if (args.itemOverrides && args.itemOverrides.length) {
      items = args.itemOverrides;
    } else {
      const mps = await ctx.db
        .query('market_products')
        .withIndex('by_market', (q) => q.eq('marketId', args.marketId))
        .collect();
      items = mps.filter((x: any) => x.active).map((x: any) => ({ productId: x.productId, unitId: x.unitId }));
    }
    if (items.length === 0) throw new Error('Chưa cấu hình danh sách sản phẩm cho chợ');

    const id = await ctx.db.insert('price_rounds', {
      marketId: args.marketId,
      forDate: date,
      items,
      status: 'open',
      managerId: (activeManagers[0].profileId as any),
      createdBy: args.creatorId,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const get = query({
  args: { id: v.id('price_rounds') },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.id);
    if (!round) return null;
    return round;
  },
});

export const getActiveForMarket = query({
  args: { marketId: v.id('markets'), date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const date = args.date ?? todayInTzYYYYMMDD('Asia/Ho_Chi_Minh');
    const round = await ctx.db
      .query('price_rounds')
      .withIndex('by_market_date', (q) => q.eq('marketId', args.marketId).eq('forDate', date))
      .unique();
    if (!round) return null;

    // Fetch current prices for this market/date
    const prices = await ctx.db
      .query('prices')
      .withIndex('by_market_date', (q) => q.eq('marketId', args.marketId).eq('date', date))
      .collect();

    const priceMap = new Map<string, any>();
    for (const p of prices) priceMap.set(((p.productId as any).id ?? (p.productId as any)).toString(), p);

    const items = round.items.map((it: any) => {
      const pid = ((it.productId as any).id ?? (it.productId as any)).toString();
      return { ...it, price: priceMap.get(pid) ?? null };
    });

    return { ...round, items };
  },
});

export const submit = mutation({
  args: {
    roundId: v.id('price_rounds'),
    productId: v.id('products'),
    editorId: v.id('profiles'),
    price: v.number(),
    noteType: v.optional(v.union(v.literal('up'), v.literal('down'), v.literal('other'))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.price <= 0) throw new Error('Giá phải > 0');

    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error('Không tìm thấy đợt lấy giá');
    if (round.status !== 'open') throw new Error('Đợt đã đóng');

    // Only allow submitting on the same day (VN TZ)
    const today = todayInTzYYYYMMDD('Asia/Ho_Chi_Minh');
    if (round.forDate !== today) throw new Error('Chỉ được nhập trong đúng ngày của đợt');

    // Validate product belongs to this round
    const item = (round.items as Array<any>).find((x) => ((x.productId as any).id ?? (x.productId as any)).toString() === (((args.productId as any).id ?? (args.productId as any)).toString()));
    if (!item) throw new Error('Sản phẩm không thuộc danh sách của đợt');

    // Enforce snapshot manager authorization if present
    if ((round as any).managerId) {
      const snap = ((round as any).managerId as any).id ?? (round as any).managerId;
      const editor = ((args.editorId as any).id ?? args.editorId);
      if (String(snap) !== String(editor)) {
        throw new Error('Chi nguoi quan ly tai thoi diem tao duoc phep nhap gia');
      }
    }

    // Optionally ensure editor is a member of this market
    const hasAccess = await ctx.db
      .query('market_members')
      .withIndex('by_market_profile', (q) => q.eq('marketId', round.marketId).eq('profileId', args.editorId))
      .unique();
    if (!hasAccess || !hasAccess.active) throw new Error('Thành viên không có quyền nhập cho chợ này');

    // Upsert into prices (unique by marketId+productId+date)
    const existing = await ctx.db
      .query('prices')
      .withIndex('by_market_product_date', (q) => q.eq('marketId', round.marketId).eq('productId', args.productId).eq('date', round.forDate))
      .unique();

    const timestamp = Date.now();

    if (existing) {
      const beforePrice = existing.price;
      await ctx.db.patch(existing._id, {
        unitId: item.unitId,
        price: args.price,
        noteType: args.noteType,
        notes: args.notes,
        updatedAt: timestamp,
        createdBy: args.editorId, // track last editor
      });
      await ctx.db.insert('price_history', {
        priceId: existing._id,
        marketId: round.marketId,
        productId: args.productId,
        date: round.forDate,
        beforePrice,
        afterPrice: args.price,
        changedBy: args.editorId,
        changedAt: timestamp,
        noteType: args.noteType,
        notes: args.notes,
      });
      return existing._id;
    } else {
      const newId = await ctx.db.insert('prices', {
        marketId: round.marketId,
        productId: args.productId,
        unitId: item.unitId,
        date: round.forDate,
        price: args.price,
        noteType: args.noteType,
        notes: args.notes,
        createdBy: args.editorId,
        createdAt: timestamp,
      });
      await ctx.db.insert('price_history', {
        priceId: newId,
        marketId: round.marketId,
        productId: args.productId,
        date: round.forDate,
        beforePrice: undefined,
        afterPrice: args.price,
        changedBy: args.editorId,
        changedAt: timestamp,
        noteType: args.noteType,
        notes: args.notes,
      });
      return newId;
    }
  },
});

// V2: submit co rang buoc theo manager snapshot neu co
export const submitV2 = mutation({
  args: {
    roundId: v.id('price_rounds'),
    productId: v.id('products'),
    editorId: v.id('profiles'),
    price: v.number(),
    noteType: v.optional(v.union(v.literal('up'), v.literal('down'), v.literal('other'))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.price <= 0) throw new Error('Gia phai > 0');

    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error('Khong tim thay dot lay gia');
    if (round.status !== 'open') throw new Error('Dot da dong');

    const today = todayInTzYYYYMMDD('Asia/Ho_Chi_Minh');
    if (round.forDate !== today) throw new Error('Chi duoc nhap trong dung ngay cua dot');

    const item = (round.items as Array<any>).find((x) => ((x.productId as any).id ?? (x.productId as any)).toString() === (((args.productId as any).id ?? (args.productId as any)).toString()));
    if (!item) throw new Error('San pham khong thuoc danh sach cua dot');

    // Enforce snapshot manager if present
    if ((round as any).managerId) {
      const snap = ((round as any).managerId as any).id ?? (round as any).managerId;
      const editor = ((args.editorId as any).id ?? args.editorId);
      if (String(snap) !== String(editor)) {
        throw new Error('Chi nguoi quan ly tai thoi diem tao duoc phep nhap gia');
      }
    } else {
      // Fallback: must be active member
      const hasAccess = await ctx.db
        .query('market_members')
        .withIndex('by_market_profile', (q) => q.eq('marketId', round.marketId).eq('profileId', args.editorId))
        .unique();
      if (!hasAccess || !hasAccess.active) throw new Error('Thanh vien khong co quyen nhap cho cho nay');
    }

    // Upsert
    const existing = await ctx.db
      .query('prices')
      .withIndex('by_market_product_date', (q) => q.eq('marketId', round.marketId).eq('productId', args.productId).eq('date', round.forDate))
      .unique();

    const timestamp = Date.now();

    if (existing) {
      const beforePrice = existing.price;
      await ctx.db.patch(existing._id, {
        unitId: item.unitId,
        price: args.price,
        noteType: args.noteType,
        notes: args.notes,
        updatedAt: timestamp,
        createdBy: args.editorId,
      });
      await ctx.db.insert('price_history', {
        priceId: existing._id,
        marketId: round.marketId,
        productId: args.productId,
        date: round.forDate,
        beforePrice,
        afterPrice: args.price,
        changedBy: args.editorId,
        changedAt: timestamp,
        noteType: args.noteType,
        notes: args.notes,
      });
      return existing._id;
    } else {
      const newId = await ctx.db.insert('prices', {
        marketId: round.marketId,
        productId: args.productId,
        unitId: item.unitId,
        date: round.forDate,
        price: args.price,
        noteType: args.noteType,
        notes: args.notes,
        createdBy: args.editorId,
        createdAt: timestamp,
      });
      await ctx.db.insert('price_history', {
        priceId: newId,
        marketId: round.marketId,
        productId: args.productId,
        date: round.forDate,
        beforePrice: undefined,
        afterPrice: args.price,
        changedBy: args.editorId,
        changedAt: timestamp,
        noteType: args.noteType,
        notes: args.notes,
      });
      return newId;
    }
  },
});

export const getWithPrices = query({
  args: { id: v.id('price_rounds') },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.id);
    if (!round) return null;
    const prices = await ctx.db
      .query('prices')
      .withIndex('by_market_date', (q) => q.eq('marketId', round.marketId).eq('date', round.forDate))
      .collect();
    const priceMap = new Map<string, any>();
    for (const p of prices) priceMap.set(((p.productId as any).id ?? (p.productId as any)).toString(), p);
    const items = (round.items as any[]).map((it: any) => {
      const pid = ((it.productId as any).id ?? (it.productId as any)).toString();
      return { ...it, price: priceMap.get(pid) ?? null };
    });
    return { ...round, items };
  },
});

export const list = query({
  args: {
    marketId: v.optional(v.id('markets')),
    status: v.optional(v.union(v.literal('open'), v.literal('closed'))),
    forDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const all = await ctx.db.query('price_rounds').collect();
    const filtered = all
      .filter((r: any) => (args.marketId ? String(((r.marketId as any).id ?? r.marketId)) === String(((args.marketId as any).id ?? args.marketId)) : true))
      .filter((r: any) => (args.status ? r.status === args.status : true))
      .filter((r: any) => (args.forDate ? r.forDate === args.forDate : true))
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, limit);
    return filtered;
  },
});

// List rounds kèm thống kê nhanh: productCount, filledCount, completion
export const listWithStatus = query({
  args: {
    marketId: v.optional(v.id('markets')),
    status: v.optional(v.union(v.literal('open'), v.literal('closed'))),
    forDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const all = await ctx.db.query('price_rounds').collect();
    const rounds = all
      .filter((r: any) => (args.marketId ? String(((r.marketId as any).id ?? r.marketId)) === String(((args.marketId as any).id ?? args.marketId)) : true))
      .filter((r: any) => (args.status ? r.status === args.status : true))
      .filter((r: any) => (args.forDate ? r.forDate === args.forDate : true))
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, limit);

    const results: any[] = [];
    for (const r of rounds) {
      const prices = await ctx.db
        .query('prices')
        .withIndex('by_market_date', (q) => q.eq('marketId', r.marketId).eq('date', r.forDate))
        .collect();
      const productIds = (r.items as Array<any>).map((x) => ((x.productId as any).id ?? (x.productId as any)).toString());
      const priceByPid = new Set<string>();
      for (const p of prices) {
        const pid = ((p.productId as any).id ?? (p.productId as any)).toString();
        if (productIds.includes(pid)) priceByPid.add(pid);
      }
      const productCount = productIds.length;
      const filledCount = priceByPid.size;
      results.push({
        round: r,
        productCount,
        filledCount,
        completion: productCount ? filledCount / productCount : 0,
      });
    }
    return results;
  },
});

export const status = query({
  args: { roundId: v.id('price_rounds') },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) return null;
    const productIds = (round.items as Array<any>).map((x) => ((x.productId as any).id ?? (x.productId as any)).toString());

    const prices = await ctx.db
      .query('prices')
      .withIndex('by_market_date', (q) => q.eq('marketId', round.marketId).eq('date', round.forDate))
      .collect();

    const priceByPid = new Map<string, any>();
    for (const p of prices) {
      const pid = ((p.productId as any).id ?? (p.productId as any)).toString();
      if (productIds.includes(pid)) priceByPid.set(pid, p);
    }

    const members = await ctx.db
      .query('market_members')
      .withIndex('by_market', (q) => q.eq('marketId', round.marketId))
      .collect();

    const progressByMember = new Map<string, number>();
    for (const p of prices) {
      const pid = ((p.productId as any).id ?? (p.productId as any)).toString();
      if (!productIds.includes(pid)) continue;
      const editor = (p.createdBy as any)?.id ?? (p.createdBy as any);
      if (editor) progressByMember.set(String(editor), (progressByMember.get(String(editor)) ?? 0) + 1);
    }

    const productCount = productIds.length;
    const filledCount = Array.from(priceByPid.keys()).length;

    return {
      round,
      productCount,
      filledCount,
      completion: productCount ? filledCount / productCount : 0,
      items: (round.items as Array<any>).map((x) => {
        const pid = ((x.productId as any).id ?? (x.productId as any)).toString();
        const p = priceByPid.get(pid) ?? null;
        return { ...x, price: p };
      }),
      members: members.map((m: any) => ({ ...m, filled: progressByMember.get(((m.profileId as any).id ?? (m.profileId as any)).toString()) ?? 0 })),
    };
  },
});

export const close = mutation({
  args: { roundId: v.id('price_rounds') },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error('Không tìm thấy đợt lấy giá');
    if (round.status === 'closed') return args.roundId;
    await ctx.db.patch(args.roundId, { status: 'closed' });
    return args.roundId;
  },
});
