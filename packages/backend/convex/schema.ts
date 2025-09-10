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
		// Password hashing (optional for service accounts)
		passwordHash: v.optional(v.string()),
		passwordSalt: v.optional(v.string()),
		mustChangePassword: v.optional(v.boolean()),
		passwordUpdatedAt: v.optional(v.number()),
		active: v.boolean(),
		createdAt: v.number(),
	}).index("by_email", ["email"]).index("by_role", ["role"]).index("by_active", ["active"]),
	market_members: defineTable({
		marketId: v.id("markets"),
		profileId: v.id("profiles"),
		active: v.boolean(),
		createdAt: v.number(),
	}).index("by_market", ["marketId"]).index("by_profile", ["profileId"]).index("by_market_profile", ["marketId", "profileId"]),
	market_products: defineTable({
		marketId: v.id("markets"),
		productId: v.id("products"),
		unitId: v.id("units"),
		active: v.boolean(),
		createdAt: v.number(),
	}).index("by_market", ["marketId"]).index("by_product", ["productId"]).index("by_market_product", ["marketId", "productId"]),
	price_rounds: defineTable({
		marketId: v.id("markets"),
		forDate: v.string(), // YYYY-MM-DD theo giờ VN
		items: v.array(v.object({ productId: v.id("products"), unitId: v.id("units") })),
		status: v.union(v.literal("open"), v.literal("closed")),
		// Snapshot manager tai thoi diem tao (co the undefined voi du lieu cu)
		managerId: v.optional(v.id("profiles")),
		createdBy: v.id("profiles"),
		createdAt: v.number(),
	}).index("by_market_date", ["marketId", "forDate"]).index("by_market_status", ["marketId", "status"]),
	prices: defineTable({
		marketId: v.id("markets"),
		productId: v.id("products"),
		unitId: v.id("units"),
		date: v.string(),
		price: v.number(),
		noteType: v.optional(v.union(v.literal("up"), v.literal("down"), v.literal("other"))),
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
		noteType: v.optional(v.union(v.literal("up"), v.literal("down"), v.literal("other"))),
		notes: v.optional(v.string()),
	}).index("by_price", ["priceId"]).index("by_market_product_date", ["marketId", "productId", "date"]),
});
