import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
		text: v.string(),
    completed: v.boolean()
  }),
  // Tài khoản quản trị
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

  // Tài khoản khảo sát (member)
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

  // Chợ
  markets: defineTable({
    name: v.string(),
    addressJson: v.object({
      provinceCode: v.optional(v.string()),
      districtCode: v.optional(v.string()),
      wardCode: v.optional(v.string()),
      detail: v.optional(v.string()),
    }),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_active", ["active"])
    .index("by_name", ["name"]),

  // Phân công chợ cho member
  marketAssignments: defineTable({
    marketId: v.id("markets"),
    memberId: v.id("members"),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_memberId", ["memberId"]).index("by_marketId", ["marketId"]),

  // Đơn vị tính
  units: defineTable({
    name: v.string(),
    abbr: v.optional(v.string()),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_name", ["name"]) // enforce uniqueness in code
    .index("by_active", ["active"]),

  // Sản phẩm (dùng chung cho mọi chợ)
  products: defineTable({
    name: v.string(),
    unitId: v.id("units"),
    note: v.optional(v.string()),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_active", ["active"]) // lọc danh mục đang dùng
    .index("by_name", ["name"]) // enforce uniqueness trong code
    .index("by_unitId", ["unitId"]),

  // Phiên khảo sát
  surveys: defineTable({
    marketId: v.id("markets"),
    memberId: v.id("members"),
    surveyDay: v.string(), // YYYY-MM-DD (Asia/Ho_Chi_Minh)
    note: v.optional(v.string()),
    lastUpdatedAt: v.optional(v.number()), // ms epoch
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_surveyDay", ["surveyDay"]) // lọc theo khoảng ngày
    .index("by_marketId", ["marketId"]) // tổng hợp theo chợ
    .index("by_memberId", ["memberId"]), // liệt kê theo người khảo sát

  // Dòng khảo sát (mỗi sản phẩm trong một survey)
  surveyItems: defineTable({
    surveyId: v.id("surveys"),
    productId: v.id("products"),
    price: v.union(v.number(), v.null()), // null = không lấy được/để trống
    note: v.optional(v.string()),
    order: v.number(), // copy từ product.order để hiển thị cố định
    active: v.boolean(),
  }).index("by_surveyId", ["surveyId"]),

  // Báo cáo snapshot (bất biến)
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
    .index("by_generatedAt", ["generatedAt"]) // liệt kê gần đây
    .index("by_from_to", ["fromDay", "toDay"]), // tra cứu theo khoảng
});
