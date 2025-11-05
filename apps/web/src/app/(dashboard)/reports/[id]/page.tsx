"use client";

import { Fragment, use, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, FileSpreadsheet, Loader2 } from "lucide-react";

function formatDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function today(): string {
  return formatDay(new Date());
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDay(date);
}

function formatDayLabel(day: string | undefined | null): string {
  if (!day) return "";
  const parts = day.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return day;
}

function statusInfo(total: number, filled: number) {
  if (total === 0) return { label: "Chua co du lieu", className: "text-muted-foreground" };
  if (filled === 0) return { label: "Chua co gia", className: "text-muted-foreground" };
  if (filled === total) return { label: "Da hoan tat", className: "text-green-600" };
  return { label: "Chua day du", className: "text-amber-600" };
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const search = useSearchParams();
  const fromParam = search?.get("from");
  const toParam = search?.get("to");
  const marketParam = search?.get("marketId");

  const defaultToday = useMemo(() => today(), []);
  const defaultFrom = useMemo(() => daysAgo(6), []);

  const [fromDay, setFromDay] = useState<string>(() => fromParam ?? defaultFrom);
  const [toDay, setToDay] = useState<string>(() => toParam ?? defaultToday);
  const [formMarketId, setFormMarketId] = useState<string | null>(marketParam);
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null);
  const [exportingSurvey, setExportingSurvey] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [meUsername, setMeUsername] = useState<string | null>(null);

  const summary = useQuery(api.reports.summaryByMarketRange, { fromDay, toDay });
  const existingReport = useQuery(api.reports.findByRange, { fromDay, toDay });
  const report = useQuery(api.reports.getFull, { id: id as any });
  const admins = useQuery(api.admins.listBrief, {} as any);
  const generateReport = useMutation(api.reports.generateRange);
  const router = useRouter();

  useEffect(() => {
    setFromDay(fromParam ?? defaultFrom);
  }, [fromParam, defaultFrom]);

  useEffect(() => {
    setToDay(toParam ?? defaultToday);
  }, [toParam, defaultToday]);

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
    if (!admins || !Array.isArray(admins) || !meUsername) return null;
    const me = (admins as any[]).find((a: any) => a.username === meUsername);
    return me?._id ?? null;
  }, [admins, meUsername]);

  const markets = useMemo(() => {
    if (report && Array.isArray((report as any)?.summaryRows)) {
      return ((report as any).summaryRows as any[]).map((row: any) => ({
        id: String(row.marketId),
        name: row.marketName,
        surveyCount: row.surveyCount,
      }));
    }
    if (summary && Array.isArray((summary as any)?.summaryRows)) {
      return ((summary as any).summaryRows as any[]).map((row: any) => ({
        id: String(row.marketId),
        name: row.marketName,
        surveyCount: row.surveyCount,
      }));
    }
    return [] as Array<{ id: string; name: string; surveyCount: number }>;
  }, [report, summary]);

  const appliedMarketId = useMemo(() => {
    if (marketParam) return marketParam;
    if (markets.length > 0) return markets[0].id;
    return null;
  }, [marketParam, markets]);

  useEffect(() => {
    if (appliedMarketId) {
      setFormMarketId(appliedMarketId);
    }
  }, [appliedMarketId]);

  useEffect(() => {
    setExpandedSurvey(null);
  }, [appliedMarketId]);

  const items = useQuery(
    api.reports.itemsByReport as any,
    appliedMarketId
      ? ({ reportId: id as any, marketId: appliedMarketId as any } as any)
      : ({ reportId: id as any } as any)
  );

  const nf = useMemo(() => new Intl.NumberFormat("vi-VN"), []);

  const surveyData = useMemo(() => {
    if (!items) return undefined as undefined | { rows: any[]; map: Map<string, any> };
    const map = new Map<string, any>();
    for (const raw of items as any[]) {
      const surveyId = String(raw.surveyId);
      const rawMarketId = String(raw.marketId);
      if (appliedMarketId && rawMarketId !== appliedMarketId) continue;
      if (!map.has(surveyId)) {
        map.set(surveyId, {
          surveyId,
          surveyDay: raw.surveyDay,
          memberName: raw.memberName,
          marketId: rawMarketId,
          marketName: raw.marketName,
          total: 0,
          filled: 0,
          items: [] as Array<{ productName: string; unit: string; price: number | null; note: string | null }>,
        });
      }
      const entry = map.get(surveyId)!;
      const price = raw.price as number | null;
      entry.total += 1;
      if (price !== null && price !== undefined) entry.filled += 1;
      entry.items.push({
        productName: raw.productName,
        unit: raw.unitAbbr ?? raw.unitName ?? "",
        price,
        note: raw.note ?? null,
      });
    }
    const rows = Array.from(map.values()).sort((a, b) => {
      if (a.surveyDay && b.surveyDay) return b.surveyDay.localeCompare(a.surveyDay);
      return 0;
    });
    return { rows, map };
  }, [items, appliedMarketId]);

  const surveys = surveyData?.rows ?? [];
  const surveyMap = surveyData?.map ?? new Map<string, any>();

  const onApplyFilters = async () => {
    if (applying) return;
    if (!fromDay || !toDay) {
      toast.error("Vui long chon khoang ngay hop le");
      return;
    }
    if (!formMarketId) {
      toast.error("Vui long chon cho");
      return;
    }
    setApplying(true);
    try {
      if (existingReport === undefined) {
        toast.info("Dang kiem tra bao cao...");
        return;
      }
      let targetId = (existingReport as any)?._id as string | undefined;
      if (!targetId) {
        if (!myAdminId) {
          toast.error("Khong xac dinh admin hien tai");
          return;
        }
        const rep = await generateReport({ fromDay, toDay, createdByAdminId: myAdminId as any });
        targetId = (rep as any)?._id as string | undefined;
        if (!targetId) {
          toast.error("Khong tao duoc bao cao");
          return;
        }
      }
      const params = new URLSearchParams();
      params.set("from", fromDay);
      params.set("to", toDay);
      params.set("marketId", formMarketId);
      router.push(`/dashboard/reports/${targetId}?${params.toString()}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Khong mo duoc bao cao");
    } finally {
      setApplying(false);
    }
  };

  const onExportSurvey = async (surveyId: string) => {
    if (exportingSurvey) return;
    const survey = surveyMap.get(surveyId);
    if (!survey) {
      toast.error("Khong tim thay du lieu khao sat");
      return;
    }
    setExportingSurvey(surveyId);
    try {
      const XLSX = await import("xlsx");
      const rows = [["San pham", "Don vi", "Gia", "Ghi chu"]];
      for (const item of survey.items) {
        rows.push([
          item.productName,
          item.unit,
          item.price === null || item.price === undefined ? "" : nf.format(item.price),
          item.note ?? "",
        ]);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 32 }, { wch: 12 }, { wch: 14 }, { wch: 30 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Survey");
      const filename = `report-${fromDay}-${toDay}-${survey.marketId}-${survey.surveyId}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Da xuat file");
    } catch (err: any) {
      toast.error(err?.message ?? "Xuat file that bai");
    } finally {
      setExportingSurvey(null);
    }
  };

  if (report === null) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Khong tim thay bao cao</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Vui long quay lai trang bao cao va thu lai.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bao cao khao sat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Tu ngay</div>
              <Input type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Den ngay</div>
              <Input type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Cho</div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={formMarketId ?? ""}
                onChange={(e) => setFormMarketId(e.target.value || null)}
              >
                {(markets ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={onApplyFilters} disabled={applying || !formMarketId}>
              {applying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Dang ap dung...
                </>
              ) : (
                "Ap dung"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sach dot khao sat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">STT</th>
                  <th className="py-2 pr-4">Ngay lay gia</th>
                  <th className="py-2 pr-4">Can bo khao sat</th>
                  <th className="py-2 pr-4">Trang thai</th>
                  <th className="py-2 pr-4 text-right">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {surveyData === undefined && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Dang tai danh sach...
                    </td>
                  </tr>
                )}
                {surveyData && surveys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Khong co du lieu
                    </td>
                  </tr>
                )}
                {surveys.map((survey, idx) => {
                  const open = expandedSurvey === survey.surveyId;
                  const info = statusInfo(survey.total, survey.filled);
                  return (
                    <Fragment key={survey.surveyId}>
                      <tr className="border-b last:border-0">
                        <td className="py-2 pr-4 align-top">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 font-medium"
                            onClick={() => setExpandedSurvey(open ? null : survey.surveyId)}
                            aria-expanded={open}
                          >
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span>{idx + 1}</span>
                          </button>
                        </td>
                        <td className="py-2 pr-4 align-top">{formatDayLabel(survey.surveyDay)}</td>
                        <td className="py-2 pr-4 align-top text-muted-foreground">{survey.memberName}</td>
                        <td className="py-2 pr-4 align-top">
                          <span className={info.className}>{info.label}</span>
                        </td>
                        <td className="py-2 pr-4 align-top text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onExportSurvey(survey.surveyId)}
                            disabled={exportingSurvey === survey.surveyId}
                          >
                            {exportingSurvey === survey.surveyId ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Dang xuat...
                              </>
                            ) : (
                              <>
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Xuat Excel
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b last:border-0">
                          <td colSpan={5} className="bg-muted/30">
                            <div className="p-4">
                              <div className="mb-3 text-sm text-muted-foreground">
                                Cho: {survey.marketName}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                  <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                      <th className="py-2 pr-4">San pham</th>
                                      <th className="py-2 pr-4">Don vi</th>
                                      <th className="py-2 pr-4">Gia (VND)</th>
                                      <th className="py-2 pr-4">Ghi chu</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {survey.items.map((item: any) => (
                                      <tr key={`${survey.surveyId}-${item.productName}`} className="border-b last:border-0">
                                        <td className="py-2 pr-4">{item.productName}</td>
                                        <td className="py-2 pr-4 text-muted-foreground">{item.unit || "-"}</td>
                                        <td className="py-2 pr-4">
                                          {item.price === null || item.price === undefined ? "-" : `${nf.format(item.price)} VND`}
                                        </td>
                                        <td className="py-2 pr-4 text-muted-foreground">{item.note || ""}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
