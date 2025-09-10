import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: {
    marketId: v.optional(v.id('markets')),
    productId: v.optional(v.id('products')),
    date: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    // Use the most specific index available
    if (args.marketId && args.productId && args.date) {
      // Use by_market_product_date index
      const q = ctx.db.query('prices')
        .withIndex('by_market_product_date', q => 
          q.eq('marketId', args.marketId!)
           .eq('productId', args.productId!)
           .eq('date', args.date!)
        );
      
      const results = await q.order('asc').take(limit + 1);
      
      let cursor = null;
      if (results.length > limit) {
        cursor = results[limit - 1]._id;
        results.pop();
      }
      
      return { prices: results, cursor };
    } else if (args.marketId && args.date) {
      // Use by_market_date index
      const q = ctx.db.query('prices')
        .withIndex('by_market_date', q => 
          q.eq('marketId', args.marketId!)
           .eq('date', args.date!)
        );
      
      const results = await q.order('asc').take(limit + 1);
      
      let cursor = null;
      if (results.length > limit) {
        cursor = results[limit - 1]._id;
        results.pop();
      }
      
      return { prices: results, cursor };
    } else if (args.productId && args.date) {
      // Use by_product_date index
      const q = ctx.db.query('prices')
        .withIndex('by_product_date', q => 
          q.eq('productId', args.productId!)
           .eq('date', args.date!)
        );
      
      const results = await q.order('asc').take(limit + 1);
      
      let cursor = null;
      if (results.length > limit) {
        cursor = results[limit - 1]._id;
        results.pop();
      }
      
      return { prices: results, cursor };
    } else {
      // Fallback to scanning all prices (less efficient)
      let q: any = ctx.db.query('prices');
      
      // Apply cursor if provided
      if (args.cursor) {
        q = q.cursor(args.cursor);
      }
      
      const results = await q.order('asc').take(limit + 1);
      
      let cursor = null;
      if (results.length > limit) {
        cursor = results[limit - 1]._id;
        results.pop();
      }
      
      return { prices: results, cursor };
    }
  },
});

export const upsert = mutation({
  args: {
    marketId: v.id('markets'),
    productId: v.id('products'),
    unitId: v.id('units'),
    date: v.string(),
    price: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate price > 0
    if (args.price <= 0) {
      throw new Error('Price must be greater than 0');
    }
    
    // Allow any date - no validation on future dates
    
    // Validate that marketId, productId, and unitId exist
    const market = await ctx.db.get(args.marketId);
    if (!market) {
      throw new Error(`Market with id ${args.marketId} not found`);
    }
    
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error(`Product with id ${args.productId} not found`);
    }
    
    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new Error(`Unit with id ${args.unitId} not found`);
    }
    
    // Find existing price record
    const existingPrice = await ctx.db.query('prices')
      .withIndex('by_market_product_date', q => 
        q.eq('marketId', args.marketId)
         .eq('productId', args.productId)
         .eq('date', args.date)
      )
      .unique();
    
    const timestamp = Date.now();
    
    if (existingPrice) {
      // Update existing record
      const beforePrice = existingPrice.price;
      
      await ctx.db.patch(existingPrice._id, {
        unitId: args.unitId,
        price: args.price,
        notes: args.notes,
        updatedAt: timestamp,
      });
      
      // Record history
      await ctx.db.insert('price_history', {
        priceId: existingPrice._id,
        marketId: args.marketId,
        productId: args.productId,
        date: args.date,
        beforePrice,
        afterPrice: args.price,
        changedAt: timestamp,
        notes: args.notes,
      });
      
      return existingPrice._id;
    } else {
      // Insert new record
      const newPriceId = await ctx.db.insert('prices', {
        marketId: args.marketId,
        productId: args.productId,
        unitId: args.unitId,
        date: args.date,
        price: args.price,
        notes: args.notes,
        createdAt: timestamp,
      });
      
      // Record history
      await ctx.db.insert('price_history', {
        priceId: newPriceId,
        marketId: args.marketId,
        productId: args.productId,
        date: args.date,
        beforePrice: undefined,
        afterPrice: args.price,
        changedAt: timestamp,
        notes: args.notes,
      });
      
      return newPriceId;
    }
  },
});

// Optional: Query to get price history for a specific market, product, and date
export const historyByMarketProductDate = query({
  args: {
    marketId: v.id('markets'),
    productId: v.id('products'),
    date: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    const history = await ctx.db.query('price_history')
      .withIndex('by_market_product_date', q => 
        q.eq('marketId', args.marketId)
         .eq('productId', args.productId)
         .eq('date', args.date)
      )
      .order('desc') // Most recent first
      .take(limit);
    
    return history;
  },
});