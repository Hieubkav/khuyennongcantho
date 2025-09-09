import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Helper function to validate slug
function validateSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > 64) {
    throw new Error('Slug must be between 1 and 64 characters');
  }
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
  }
  return trimmed;
}

// Helper function to validate name
function validateName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 128) {
    throw new Error('Name must be between 1 and 128 characters');
  }
  return trimmed;
}

export const list = query({
  args: {
    active: v.optional(v.boolean()),
    name: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    let q: any = ctx.db.query('markets');
    
    if (args.active !== undefined) {
      q = q.withIndex('by_active', (q: any) => q.eq('active', args.active));
    }
    
    if (args.name) {
      // For name search, we need to filter after querying since Convex doesn't support text search directly
      // This is a simplified approach - in production you might want to use a more sophisticated search
      const allMarkets = await q.collect();
      const filteredMarkets = allMarkets.filter((market: any) => 
        market.name.toLowerCase().includes(args.name!.toLowerCase())
      );
      return { markets: filteredMarkets.slice(0, limit), cursor: null };
    }
    
    // Apply cursor if provided
    if (args.cursor) {
      q = q.cursor(args.cursor);
    }
    
    // Order and limit results
    const results = await q.order('asc').take(limit + 1);
    
    let cursor = null;
    if (results.length > limit) {
      cursor = results[limit - 1]._id;
      results.pop();
    }
    
    return { markets: results, cursor };
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slug = validateSlug(args.slug);
    const name = validateName(args.name);
    
    // Check if market with this slug already exists
    const existingMarket = await ctx.db.query('markets')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();
      
    if (existingMarket) {
      throw new Error(`Market with slug "${slug}" already exists`);
    }
    
    // Insert new market
    const marketId = await ctx.db.insert('markets', {
      slug,
      name,
      location: args.location,
      active: true,
      createdAt: Date.now(),
    });
    
    return marketId;
  },
});

export const update = mutation({
  args: {
    id: v.id('markets'),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get existing market
    const existingMarket = await ctx.db.get(args.id);
    if (!existingMarket) {
      throw new Error(`Market with id ${args.id} not found`);
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (args.name !== undefined) {
      updateData.name = validateName(args.name);
    }
    
    if (args.location !== undefined) {
      updateData.location = args.location;
    }
    
    if (args.active !== undefined) {
      updateData.active = args.active;
    }
    
    // Update market if there are changes
    if (Object.keys(updateData).length > 0) {
      await ctx.db.patch(args.id, updateData);
    }
    
    return args.id;
  },
});

export const bySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const slug = validateSlug(args.slug);
    
    return await ctx.db.query('markets')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();
  },
});

// New delete mutation
export const deleteMarket = mutation({
  args: {
    id: v.id('markets'),
  },
  handler: async (ctx, args) => {
    // Check if market exists
    const existingMarket = await ctx.db.get(args.id);
    if (!existingMarket) {
      throw new Error(`Market with id ${args.id} not found`);
    }
    
    // Delete the market
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});