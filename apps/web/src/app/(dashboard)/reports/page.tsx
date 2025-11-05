"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function today(): string {
  return formatDay(new Date());
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDay(date);
}

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const defaultToday = useMemo(() => today(), []);
  const defaultFrom = useMemo(() => daysAgo(6), []);
  const [fromDay, setFromDay] = useState<string>(() => fromParam ?? defaultFrom);
  const [toDay, setToDay] = useState<string>(() => toParam ?? defaultToday);
  const summary = useQuery(api.reports.summaryByMarketRange, { fromDay, toDay });
  const existingReport = useQuery(api.reports.findByRange, { fromDay, toDay });
  const admins = useQuery(api.admins.listBrief, {} as any);
  const generateReport = useMutation(api.reports.generateRange);
  const router = useRouter();
  const [meUsername, setMeUsername] = useState<string | null>(null);
  const [viewingMarket, setViewingMarket] = useState<string | null>(null);

  const applyFilters = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("from", fromDay);
    params.set("to", toDay);
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setMeUsername(j?.ok ? j.username : null);
      })
      .catch(() => {
        if (!cancelled) setMeUsername(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const myAdminId = useMemo(() => {
    if (!admins || !meUsername) return null;
    const me = (admins as any[]).find((a: any) => a.username === meUsername);
    return me?._id ?? null;
  }, [admins, meUsername]);

  const onViewMarket = async (marketId: string) => {
    if (viewingMarket) return;
    if (existingReport === undefined) {
      toast.info("Dang kiem tra bao cao...");
      return;
    }
    setViewingMarket(marketId);
    try {
      let reportId = (existingReport as any)?._id;
      if (!reportId) {
        if (!myAdminId) {
          toast.error("Khong xac dinh admin hien tai");
          return;
        }
        const rep = await generateReport({ fromDay, toDay, createdByAdminId: myAdminId as any });
        reportId = (rep as any)?._id;
        if (!reportId) {
          toast.error("Khong mo duoc bao cao");
          return;
        }
      }
      router.push(`/dashboard/reports/${reportId}?from=${fromDay}&to=${toDay}&marketId=${marketId}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Khong xem duoc bao cao");
    } finally {
      setViewingMarket(null);
    }
  };

  useEffect(() => {
    const nextFrom = fromParam ?? defaultFrom;
    const nextTo = toParam ?? defaultToday;

    setFromDay((prev) => (prev === nextFrom ? prev : nextFrom));
    setToDay((prev) => (prev === nextTo ? prev : nextTo));
  }, [fromParam, toParam, defaultFrom, defaultToday]);

  return (
    <div className="space-y-6">
      {/* Live summary table */}
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo khảo sát</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <div className="text-sm text-muted-foreground">Từ ngày</div>
              <Input type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Đến ngày</div>
              <Input type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
            </div>
            <Button onClick={applyFilters}>Xem</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">STT</th>
                  <th className="py-2 pr-4">Ten cho</th>
                  <th className="py-2 pr-4">Can bo khao sat</th>
                  <th className="py-2 pr-4">Khao sat</th>
                  <th className="py-2 pr-4">So lan khao sat</th>
                  <th className="py-2 pr-4 text-right">Xem</th>
                </tr>
              </thead>
              <tbody>
                {(summary as any)?.summaryRows?.map((r: any, idx: number) => {
                  const mid = String(r.marketId ?? idx);
                  return (
                    <tr key={mid} className="border-b last:border-0">
                      <td className="py-2 pr-4">{idx + 1}</td>
                      <td className="py-2 pr-4">{r.marketName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{(r.memberNames || []).join(", ")}</td>
                      <td className="py-2 pr-4">{r.surveyCount > 0 ? "Da khao sat" : "Chua khao sat"}</td>
                      <td className="py-2 pr-4">{r.surveyCount}</td>
                      <td className="py-2 pr-4 text-right">
                        {r.surveyCount <= 0 ? (
                          <span className="text-muted-foreground text-xs">-</span>
                        ) : existingReport === undefined ? (
                          <span className="text-muted-foreground text-xs">Dang kiem tra...</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewMarket(mid)}
                            disabled={viewingMarket === mid}
                          >
                            {viewingMarket === mid ? "Dang mo..." : "Xem"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {summary && (summary as any).summaryRows?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">Khong co du lieu</td>
                  </tr>
                )}
                {!summary && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">Dang tai tong hop...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
