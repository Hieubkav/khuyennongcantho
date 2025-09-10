import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

function sanitize(user: any) {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...rest } = user;
  return rest;
}

export const list = query({
  args: {
    role: v.optional(v.union(v.literal('admin'), v.literal('member'))),
    active: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    let q: any = ctx.db.query('profiles');
    if (args.active !== undefined) {
      q = q.withIndex('by_active', (x: any) => x.eq('active', args.active));
    }
    if (args.role) {
      q = q.withIndex('by_role', (x: any) => x.eq('role', args.role));
    }
    const results = await q.take(limit);
    return results.map(sanitize);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();
    return sanitize(existing);
  },
});

export const getById = query({
  args: { id: v.id('profiles') },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.id);
    return sanitize(p);
  },
});

// Batch: public info by ids (sans secrets)
export const getManyPublic = query({
  args: { ids: v.array(v.id('profiles')) },
  handler: async (ctx, args) => {
    const results: any[] = [];
    for (const id of args.ids) {
      const p = await ctx.db.get(id);
      if (p) results.push(sanitize(p));
    }
    return results;
  },
});

// Internal use by actions: return secrets for auth flow
export const getSecretsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('profiles')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();
    return user ?? null; // includes passwordHash/passwordSalt
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal('admin'), v.literal('member')),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email.includes('@')) throw new Error('Email không hợp lệ');

    const existed = await ctx.db
      .query('profiles')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();
    if (existed) throw new Error('Email đã tồn tại');
    const id = await ctx.db.insert('profiles', {
      email,
      name: args.name,
      role: args.role,
      passwordHash: args.passwordHash,
      passwordSalt: args.passwordSalt,
      active: true,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('profiles'),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal('admin'), v.literal('member'))),
    active: v.optional(v.boolean()),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    mustChangePassword: v.optional(v.boolean()),
    passwordUpdatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.id);
    if (!profile) throw new Error('Không tìm thấy người dùng');

    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.role !== undefined) patch.role = args.role;
    if (args.active !== undefined) patch.active = args.active;
    if (args.passwordHash !== undefined) patch.passwordHash = args.passwordHash;
    if (args.passwordSalt !== undefined) patch.passwordSalt = args.passwordSalt;
    if (args.mustChangePassword !== undefined) patch.mustChangePassword = args.mustChangePassword;
    if (args.passwordUpdatedAt !== undefined) patch.passwordUpdatedAt = args.passwordUpdatedAt;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
    }
    return args.id;
  },
});
