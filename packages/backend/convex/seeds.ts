import { mutation } from './_generated/server';
import { v } from 'convex/values';

// Define the unit data
const unitsData = [
  { code: 'kg', name: 'Kilogram' },
  { code: 'g', name: 'Gram' },
  { code: 'ta', name: 'Tạ' },
  { code: 'tan', name: 'Tấn' },
  { code: 'bo', name: 'Bó' },
  { code: 'tui', name: 'Túi' },
  { code: 'chai', name: 'Chai' },
  { code: 'lit', name: 'Lít' },
  { code: 'trai', name: 'Trái' },
  { code: 'cay', name: 'Cây' },
  { code: 'noi', name: 'Nồi' },
  { code: 'chuc', name: 'Chục' },
];

export const seedUnits = mutation({
  args: {},
  handler: async (ctx) => {
    for (const unit of unitsData) {
      // Check if unit with this code already exists
      const existingUnit = await ctx.db.query('units').withIndex('by_code', q => q.eq('code', unit.code)).unique();
      
      // If it doesn't exist, insert it
      if (!existingUnit) {
        await ctx.db.insert('units', {
          code: unit.code,
          name: unit.name,
          active: true,
          createdAt: Date.now(),
        });
      }
    }
  },
});
