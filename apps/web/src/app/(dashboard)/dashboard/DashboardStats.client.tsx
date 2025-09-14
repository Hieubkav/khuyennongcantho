"use client";

import { useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmtDelta(p: number) {
  if (!isFinite(p)) return "0%";
  const s = Math.round(p * 10) / 10; // 1 decimal
  const sign = s > 0 ? "+" : s < 0 ? "" : "";
  return `${sign}${s}%`;
}

export default function DashboardStats() {
  const data = useQuery((api as any).stats.dashboard as any, {} as any) as any;

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="transition-colors hover:border-foreground/20">
        <CardHeader>
          <CardTitle>Nguoi dung</CardTitle>
          <CardDescription>Trong 30 ngay qua</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div className="text-3xl font-semibold">{data ? data.users.value : "-"}</div>
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            {data ? fmtDelta(data.users.deltaPercent) : "-"}
          </Badge>
        </CardContent>
      </Card>

      <Card className="transition-colors hover:border-foreground/20">
        <CardHeader>
          <CardTitle>Tuong tac</CardTitle>
          <CardDescription>Hom nay</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div className="text-3xl font-semibold">{data ? data.interactions.value : "-"}</div>
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            {data ? fmtDelta(data.interactions.deltaPercent) : "-"}
          </Badge>
        </CardContent>
      </Card>

      <Card className="transition-colors hover:border-foreground/20">
        <CardHeader>
          <CardTitle>Don vi</CardTitle>
          <CardDescription>Dang hoat dong</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div className="text-3xl font-semibold">{data ? data.units.active : "-"}</div>
          <Badge variant="outline" className="text-sky-600 dark:text-sky-400 border-sky-500/30">On dinh</Badge>
        </CardContent>
      </Card>

      <Card className="transition-colors hover:border-foreground/20">
        <CardHeader>
          <CardTitle>Bao cao</CardTitle>
          <CardDescription>Thang nay</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div className="text-3xl font-semibold">{data ? data.reports.monthCount : "-"}</div>
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30">
            {data ? `${data.reports.deltaNew >= 0 ? "+" : ""}${data.reports.deltaNew} moi` : "-"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
