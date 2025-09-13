"use client";

import { useSettings } from "@/hooks/useSettings";

export function DashboardHeading() {
  const { siteName } = useSettings();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{siteName} Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">Tổng quan nhanh và hoạt động gần đây.</p>
    </div>
  );
}

