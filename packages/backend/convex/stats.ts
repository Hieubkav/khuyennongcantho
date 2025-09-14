import { query } from "./_generated/server";
import { v } from "convex/values";

function dayStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, delta: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function prevMonthStart(date: Date) {
  const m = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return m;
}

function nextMonthStart(date: Date) {
  const m = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return m;
}

export const dashboard = query({
  args: {},
  handler: async (ctx, _args) => {
    const now = new Date();

    // 30-day windows (inclusive)
    const currFrom = dayStr(addDays(now, -29));
    const currTo = dayStr(now);
    const prevFrom = dayStr(addDays(now, -59));
    const prevTo = dayStr(addDays(now, -30));

    // Load surveys from previous 60 days to cover both windows
    const surveys60 = await ctx.db
      .query("surveys")
      .withIndex("by_surveyDay", (q: any) => q.gte("surveyDay", prevFrom))
      .collect();

    const survCurr = surveys60.filter(
      (s: any) => s.active === true && s.surveyDay >= currFrom && s.surveyDay <= currTo
    );
    const survPrev = surveys60.filter(
      (s: any) => s.active === true && s.surveyDay >= prevFrom && s.surveyDay <= prevTo
    );

    // Users metric = distinct members who submitted surveys in last 30 days
    const memCurr = new Set(survCurr.map((s: any) => String(s.memberId)));
    const memPrev = new Set(survPrev.map((s: any) => String(s.memberId)));
    const usersCurr = memCurr.size;
    const usersPrev = memPrev.size;
    const usersDelta = usersPrev > 0 ? ((usersCurr - usersPrev) / usersPrev) * 100 : 0;

    // Interactions today = number of surveys today (active only)
    const todayStr = dayStr(now);
    const survToday = surveys60.filter((s: any) => s.active === true && s.surveyDay === todayStr).length;
    const yesterdayStr = dayStr(addDays(now, -1));
    const survYesterday = surveys60.filter((s: any) => s.active === true && s.surveyDay === yesterdayStr).length;
    const interactDelta = survYesterday > 0 ? ((survToday - survYesterday) / survYesterday) * 100 : 0;

    // Units active
    const unitsActive = await ctx.db
      .query("units")
      .withIndex("by_active", (q: any) => q.eq("active", true))
      .collect();

    // Reports this month (active only)
    const ms = monthStart(now).getTime();
    const nextMs = nextMonthStart(now).getTime();
    const reportsAll = await ctx.db
      .query("reports")
      .withIndex("by_generatedAt", (q: any) => q.gte("generatedAt", ms))
      .collect();
    const reportsThisMonth = reportsAll.filter((r: any) => r.generatedAt < nextMs && r.active === true).length;

    // Prev month window for delta
    const pms = prevMonthStart(now).getTime();
    const pnms = monthStart(now).getTime();
    const reportsPrevMonthRows = await ctx.db
      .query("reports")
      .withIndex("by_generatedAt", (q: any) => q.gte("generatedAt", pms))
      .collect();
    const reportsPrevMonth = reportsPrevMonthRows.filter((r: any) => r.generatedAt < pnms && r.active === true).length;
    const reportsDelta = reportsPrevMonth > 0 ? reportsThisMonth - reportsPrevMonth : reportsThisMonth;

    return {
      users: { value: usersCurr, deltaPercent: usersDelta },
      interactions: { value: survToday, deltaPercent: interactDelta },
      units: { active: unitsActive.length },
      reports: { monthCount: reportsThisMonth, deltaNew: reportsDelta },
    } as const;
  },
});

