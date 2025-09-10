import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
	}),
	units: defineTable({
		code: v.string(),
		name: v.string(),
		active: v.boolean(),
		createdAt: v.number(),
	}).index("by_code", ["code"]).index("by_active", ["active"]),
	products: defineTable({
		slug: v.string(),
		name: v.string(),
		defaultUnitId: v.id("units"),
		active: v.boolean(),
		createdAt: v.number(),
	}).index("by_slug", ["slug"]).index("by_name", ["name"]).index("by_active", ["active"]).index("by_defaultUnit", ["defaultUnitId"]),
	markets: defineTable({
		slug: v.string(),
		name: v.string(),
		location: v.optional(v.string()),
		active: v.boolean(),
		createdAt: v.number(),
	}).index("by_slug", ["slug"]).index("by_name", ["name"]).index("by_active", ["active"]),
	profiles: defineTable({
		email: v.string(),
		name: v.optional(v.string()),
		role: v.union(v.literal("admin"), v.literal("member")),
		active: v.boolean(),
		createdAt: v.number(),
	}).index("by_email", ["email"]).index("by_role", ["role"]).index("by_active", ["active"]),
	market_members: defineTable({
		marketId: v.id("markets"),
		profileId: v.id("profiles"),
		active: v.boolean(),
		createdAt: v.number(),
	}).index("by_market", ["marketId"]).index("by_profile", ["profileId"]).index("by_market_profile", ["marketId", "profileId"]),
	prices: defineTable({
		marketId: v.id("markets"),
		productId: v.id("products"),
		unitId: v.id("units"),
		date: v.string(),
		price: v.number(),
		notes: v.optional(v.string()),
		createdBy: v.optional(v.id("profiles")),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	}).index("by_market_date", ["marketId", "date"]).index("by_product_date", ["productId", "date"]).index("by_market_product_date", ["marketId", "productId", "date"]),
	price_history: defineTable({
		priceId: v.id("prices"),
		marketId: v.id("markets"),
		productId: v.id("products"),
		date: v.string(),
		beforePrice: v.optional(v.number()),
		afterPrice: v.number(),
		changedBy: v.optional(v.id("profiles")),
		changedAt: v.number(),
		notes: v.optional(v.string()),
	}).index("by_price", ["priceId"]).index("by_market_product_date", ["marketId", "productId", "date"]),
});
