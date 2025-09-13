import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed products with the unit "đ/kg" into Production.
// - Idempotent: skips products that already exist by name.
// - Preserves existing products; only appends missing ones.
// - Uses the given order of names for new items (after existing max order).

const UNIT_NAME = "đ/kg";
const UNIT_ABBR = "đ/kg";

// The list provided by the user (exact names).
const PRODUCT_NAMES: string[] = [
  "Gạo Hầm Trâu, IR50404",
  "Gạo dài",
  "Gạo Jasmine",
  "Gạo đặc sản (ST, Nàng thơm …..)",
  "Đậu Nành",
  "Đậu Xanh",
  "Dưa leo",
  "Cải bắp (Trắng)",
  "Cải Xanh",
  "Xà Lách (Lụa)",
  "Cà chua (Chế Biến)",
  "Thịt Gà Công Nghiệp",
  "Gà Ta làm sẳn",
  "Vịt Ta làm sẳn",
  "Thịt Heo Đùi",
  "Thịt Heo Thăn",
  "Thịt Bò Đùi",
  "Thịt Bò Thăn",
  "Cá Lóc Đồng >500g/kg",
  "Cá Lóc Nuôi",
  "Cá Tra",
  "Cá Điêu Hồng",
  "Lươn",
  "Tôm Càng Xanh",
  "Dưa Hấu",
  "Đu Đủ",
  "Chuối (Già)",
  "Cam Mật",
  "Cam Sành",
  "Quýt Đường",
  "Bưởi Năm Roi",
  "Bưởi Da Xanh",
  "Xoài Cát Hòa Lộc",
  "Sầu Riêng Hạt Lép",
  "Măng Cụt",
  "Mãng Cầu Ta (Na)",
  "Chôm Chôm",
  "Nhãn Xuồng Cơm Vàng",
  "Ổi Lê",
  "Thanh Long",
];

export const seedProductsVndPerKg = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    // 1) Ensure the unit exists (by name) or create it.
    let unit = await ctx.db
      .query("units")
      .withIndex("by_name", (q) => q.eq("name", UNIT_NAME))
      .first();

    if (!unit) {
      // Compute next order for units
      const allUnits = await ctx.db.query("units").collect();
      const nextUnitOrder = allUnits.length
        ? Math.max(...allUnits.map((u) => u.order ?? 0)) + 1
        : 0;

      if (args.dryRun) {
        // Create a fake unit object for dry run flow
        unit = {
          _id: undefined as any,
          _creationTime: Date.now(),
          name: UNIT_NAME,
          abbr: UNIT_ABBR,
          order: nextUnitOrder,
          active: true,
        } as any;
      } else {
        const unitId = await ctx.db.insert("units", {
          name: UNIT_NAME,
          abbr: UNIT_ABBR,
          order: nextUnitOrder,
          active: true,
        });
        unit = (await ctx.db.get(unitId))!;
      }
    }

    // 2) Determine starting order for new products (append to existing).
    const existingProducts = await ctx.db.query("products").collect();
    const currentMaxOrder = existingProducts.length
      ? Math.max(...existingProducts.map((p) => p.order ?? 0))
      : -1;
    let nextOrder = currentMaxOrder + 1;

    // Build a set of existing names for quick lookup.
    const existingByName = new Set(
      existingProducts.map((p) => (p.name || "").trim())
    );

    const created: string[] = [];
    const skipped: string[] = [];

    for (const rawName of PRODUCT_NAMES) {
      const name = rawName.trim();
      if (existingByName.has(name)) {
        skipped.push(name);
        continue;
      }
      if (args.dryRun) {
        created.push(name);
        nextOrder += 1; // pretend we used an order slot
        continue;
      }
      await ctx.db.insert("products", {
        name,
        unitId: (unit! as any)._id,
        note: undefined,
        order: nextOrder,
        active: true,
      });
      created.push(name);
      nextOrder += 1;
    }

    return {
      unit: { name: (unit! as any).name, abbr: (unit! as any).abbr },
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    };
  },
});
