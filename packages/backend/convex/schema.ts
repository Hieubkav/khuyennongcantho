import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Demo todos
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),

  // Admin accounts
  admins: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_username", ["username"]) // enforce uniqueness in code
    .index("by_active", ["active"]),

  // Member (surveyors)
  members: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_username", ["username"]) // enforce uniqueness in code
    .index("by_active", ["active"]),

  // Markets
  markets: defineTable({
    name: v.string(),
    addressJson: v.object({
      provinceCode: v.optional(v.string()),
      districtCode: v.optional(v.string()),
      wardCode: v.optional(v.string()),
      detail: v.optional(v.string()),
    }),
    note: v.optional(v.string()),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_active", ["active"]) // filter active list
    .index("by_name", ["name"]),

  // Assignments: market ↔ member
  marketAssignments: defineTable({
    marketId: v.id("markets"),
    memberId: v.id("members"),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_memberId", ["memberId"]) // list markets by member
    .index("by_marketId", ["marketId"]), // list members by market

  // Units
  units: defineTable({
    name: v.string(),
    abbr: v.optional(v.string()),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_name", ["name"]) // enforce uniqueness in code
    .index("by_active", ["active"]),

  // Products
  products: defineTable({
    name: v.string(),
    unitId: v.id("units"),
    note: v.optional(v.string()),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_active", ["active"]) // filter active list
    .index("by_name", ["name"]) // enforce uniqueness in code
    .index("by_unitId", ["unitId"]),

  // Surveys
  surveys: defineTable({
    marketId: v.id("markets"),
    memberId: v.id("members"),
    surveyDay: v.string(), // YYYY-MM-DD (Asia/Ho_Chi_Minh)
    note: v.optional(v.string()),
    lastUpdatedAt: v.optional(v.number()), // ms epoch
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_surveyDay", ["surveyDay"]) // range filter
    .index("by_marketId", ["marketId"]) // aggregate by market
    .index("by_memberId", ["memberId"]), // list by member

  // Survey items (per product per survey)
  surveyItems: defineTable({
    surveyId: v.id("surveys"),
    productId: v.id("products"),
    price: v.union(v.number(), v.null()), // null = not available/blank
    note: v.optional(v.string()),
    order: v.number(), // copy from product.order for stable display
    active: v.boolean(),
  }).index("by_surveyId", ["surveyId"]),

  // Reports (immutable snapshot summary)
  reports: defineTable({
    fromDay: v.string(), // YYYY-MM-DD
    toDay: v.string(), // YYYY-MM-DD
    generatedAt: v.number(), // ms epoch
    createdByAdminId: v.id("admins"),
    summaryRows: v.array(
      v.object({
        marketId: v.id("markets"),
        marketName: v.string(),
        memberNames: v.array(v.string()),
        surveyCount: v.number(),
        filledCount: v.number(),
      })
    ),
    includedSurveyIds: v.array(v.id("surveys")),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_generatedAt", ["generatedAt"]) // list recent
    .index("by_from_to", ["fromDay", "toDay"]), // query by range

  // Report item snapshots (immutable)
  reportItems: defineTable({
    reportId: v.id("reports"),
    surveyId: v.id("surveys"),
    surveyDay: v.string(),
    marketId: v.id("markets"),
    marketName: v.string(),
    memberId: v.id("members"),
    memberName: v.string(),
    productId: v.id("products"),
    productName: v.string(),
    unitName: v.optional(v.string()),
    unitAbbr: v.optional(v.string()),
    price: v.union(v.number(), v.null()),
    note: v.optional(v.string()),
    order: v.number(),
  })
    .index("by_reportId", ["reportId"]) // fetch all items for a report
    .index("by_report_market", ["reportId", "marketId"]), // filter per market within report
});
