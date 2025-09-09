import { query } from './_generated/server';
import { v } from 'convex/values';

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

