import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const GLOBAL_KEY = "global" as const;

export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_KEY))
      .first();
    if (!row) {
      return {
        siteName: "Khuyến Nông Cần Thơ",
        pageSize: 10,
      } as const;
    }
    return { siteName: row.siteName, pageSize: row.pageSize } as const;
  },
});

export const save = mutation({
  args: {
    siteName: v.string(),
    pageSize: v.number(),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.max(1, Math.min(Math.floor(args.pageSize), 100));
    const now = Date.now();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", GLOBAL_KEY))
      .first();
    if (!existing) {
      await ctx.db.insert("settings", {
        key: GLOBAL_KEY,
        siteName: args.siteName,
        pageSize,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        siteName: args.siteName,
        pageSize,
        updatedAt: now,
      });
    }
    return { success: true } as const;
  },
});

