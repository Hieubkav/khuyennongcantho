import { mutation } from './_generated/server';
import { v } from 'convex/values';

// Reopen a closed round
export const reopen = mutation({
  args: { roundId: v.id('price_rounds') },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error('Round not found');
    if (round.status === 'open') return args.roundId;
    await ctx.db.patch(args.roundId, { status: 'open' });
    return args.roundId;
  },
});

// Update forDate of a round (only when no price data yet)
export const updateForDate = mutation({
  args: { roundId: v.id('price_rounds'), forDate: v.string() },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error('Round not found');
    // prevent duplicate round for same market/date
    const dup = await ctx.db
      .query('price_rounds')
      .withIndex('by_market_date', (q) => q.eq('marketId', round.marketId).eq('forDate', args.forDate))
      .unique();
    if (dup && String((dup._id as any)) !== String((args.roundId as any))) {
      throw new Error('Another round already exists for this date');
    }
    // ensure there is no existing price data for old date
    const hasPrices = await ctx.db
      .query('prices')
      .withIndex('by_market_date', (q) => q.eq('marketId', round.marketId).eq('date', round.forDate))
      .first();
    if (hasPrices) throw new Error('Cannot change date: price data already exists');
    await ctx.db.patch(args.roundId, { forDate: args.forDate });
    return args.roundId;
  },
});

// Remove a round (only when there is no price data yet)
export const remove = mutation({
  args: { roundId: v.id('price_rounds') },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) return null;
    const anyPrice = await ctx.db
      .query('prices')
      .withIndex('by_market_date', (q) => q.eq('marketId', round.marketId).eq('date', round.forDate))
      .first();
    if (anyPrice) throw new Error('Cannot delete: price data exists');
    await ctx.db.delete(args.roundId);
    return args.roundId;
  },
});

