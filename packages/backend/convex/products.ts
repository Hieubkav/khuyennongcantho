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
    
    let q: any = ctx.db.query('products');
    
    if (args.active !== undefined) {
      q = q.withIndex('by_active', (q: any) => q.eq('active', args.active));
    }
    
    if (args.name) {
      // For name search, we need to filter after querying since Convex doesn't support text search directly
      // This is a simplified approach - in production you might want to use a more sophisticated search
      const allProducts = await q.collect();
      const filteredProducts = allProducts.filter((product: any) => 
        product.name.toLowerCase().includes(args.name!.toLowerCase())
      );
      return { products: filteredProducts.slice(0, limit), cursor: null };
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
    
    return { products: results, cursor };
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    defaultUnitId: v.id('units'),
  },
  handler: async (ctx, args) => {
    const slug = validateSlug(args.slug);
    const name = validateName(args.name);
    
    // Check if product with this slug already exists
    const existingProduct = await ctx.db.query('products')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();
      
    if (existingProduct) {
      throw new Error(`Product with slug "${slug}" already exists`);
    }
    
    // Check if the unit exists
    const unit = await ctx.db.get(args.defaultUnitId);
    if (!unit) {
      throw new Error(`Unit with id ${args.defaultUnitId} not found`);
    }
    
    // Insert new product
    const productId = await ctx.db.insert('products', {
      slug,
      name,
      defaultUnitId: args.defaultUnitId,
      active: true,
      createdAt: Date.now(),
    });
    
    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id('products'),
    name: v.optional(v.string()),
    defaultUnitId: v.optional(v.id('units')),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get existing product
    const existingProduct = await ctx.db.get(args.id);
    if (!existingProduct) {
      throw new Error(`Product with id ${args.id} not found`);
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (args.name !== undefined) {
      updateData.name = validateName(args.name);
    }
    
    if (args.defaultUnitId !== undefined) {
      // Check if the unit exists
      const unit = await ctx.db.get(args.defaultUnitId);
      if (!unit) {
        throw new Error(`Unit with id ${args.defaultUnitId} not found`);
      }
      updateData.defaultUnitId = args.defaultUnitId;
    }
    
    if (args.active !== undefined) {
      updateData.active = args.active;
    }
    
    // Update product if there are changes
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
    
    return await ctx.db.query('products')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();
  },
});

// New delete mutation
export const deleteProduct = mutation({
  args: {
    id: v.id('products'),
  },
  handler: async (ctx, args) => {
    // Check if product exists
    const existingProduct = await ctx.db.get(args.id);
    if (!existingProduct) {
      throw new Error(`Product with id ${args.id} not found`);
    }
    
    // Delete the product
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});