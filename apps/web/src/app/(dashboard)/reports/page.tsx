"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Trash2, ChevronRight, ChevronDown, Eye } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/pagination";
import { useSettings } from "@/hooks/useSettings";

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReportsPage() {
  const [fromDay, setFromDay] = useState<string>(today());
  const [toDay, setToDay] = useState<string>(today());
  const summary = useQuery(api.reports.summaryByMarketRange, { fromDay, toDay });
  const list = useQuery(api.reports.listBrief, {} as any);
  const admins = useQuery(api.admins.listBrief, {} as any);
  const generate = useMutation(api.reports.generateRange);
  const toggleActive = useMutation(api.reports.toggleActive);
  const remove = useMutation(api.reports.remove);
  const existingReport = useQuery(api.reports.findByRange, { fromDay, toDay });
  const { pageSize } = useSettings();
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [openMarkets, setOpenMarkets] = useState<Record<string, boolean>>({});

  const [meUsername, setMeUsername] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((j) => setMeUsername(j?.ok ? j.username : null))
      .catch(() => setMeUsername(null));
  }, []);

  const myAdminId = useMemo(() => {
    if (!admins || !meUsername) return null;
    const me = (admins as any[]).find((a: any) => a.username === meUsername);
    return me?._id ?? null;
  }, [admins, meUsername]);

  const filteredList = useMemo(() => {
    if (!list) return undefined;
    if (statusFilter === "all") return list;
    const wantActive = statusFilter === "active";
    return (list as any[]).filter((r: any) => !!r.active === wantActive);
  }, [list, statusFilter]);

  // Reset to page 1 when filter changes
  useEffect(() => setPage(1), [statusFilter]);

  const onGenerate = async () => {
    try {
      if (!myAdminId) return toast.error("Khong xac dinh admin hien tai");
      const rep = await generate({ fromDay, toDay, createdByAdminId: myAdminId as any });
      toast.success("Da tao bao cao");
      location.href = `/dashboard/reports/${(rep as any)._id}`;
    } catch (err: any) {
      toast.error(err?.message ?? "Tao bao cao that bai");
    }
  };

  const onToggle = async (id: string, next: boolean) => {
    try {
      await toggleActive({ id: id as any, active: next });
    } catch (err: any) {
      toast.error(err?.message ?? "Cap nhat trang thai that bai");
    }
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Ban co chac muon xoa bao cao nay? Hanh dong nay khong the hoan tac.");
    if (!ok) return;
    try {
      await remove({ id: id as any });
      toast.success("Da xoa bao cao");
    } catch (err: any) {
      toast.error(err?.message ?? "Xoa bao cao that bai");
    }
  };

  const formatDateTimeVN = (ms: number) =>
    new Date(ms).toLocaleString("vi-VN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

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
            <Button onClick={onGenerate} disabled={!summary || !myAdminId}>Xuất báo cáo</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4"></th>
                  <th className="py-2 pr-4">STT</th>
                  <th className="py-2 pr-4">Tên chợ</th>
                  <th className="py-2 pr-4">Cán bộ khảo sát</th>
                  <th className="py-2 pr-4">Khảo sát</th>
                  <th className="py-2 pr-4">Số lần khảo sát</th>
                  <th className="py-2 pr-4 text-center w-16">Xem</th>
                </tr>
              </thead>
              <tbody>
                {(summary as any)?.summaryRows?.map((r: any, idx: number) => {
                  const mid = String(r.marketId);
                  const open = !!openMarkets[mid];
                  const times = (summary as any)?.marketSurveyTimes?.[mid] || [];
                  const surveys = (summary as any)?.marketSurveys?.[mid] || [];
                  const oneSurveyId = surveys && surveys.length === 1 && surveys[0]?.id ? String(surveys[0].id) : null;
                  return (
                    <Fragment key={mid}>
                      <tr className="border-b last:border-0">
                        <td className="py-2 pr-2">
                          <button
                            aria-label="toggle"
                            className="inline-flex items-center"
                            onClick={() => setOpenMarkets((s) => ({ ...s, [mid]: !s[mid] }))}
                          >
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="py-2 pr-4">{idx + 1}</td>
                        <td className="py-2 pr-4">{r.marketName}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{(r.memberNames || []).join(", ")}</td>
                        <td className="py-2 pr-4">{r.surveyCount > 0 ? "Da khao sat" : "Chua khao sat"}</td>
                        <td className="py-2 pr-4">{r.surveyCount}</td>
                        <td className="py-2 pr-4 text-center"></td>
                      </tr>
                      {open && (
                        <tr className="border-b last:border-0">
                          <td></td>
                          <td colSpan={6} className="py-2 pr-4 text-sm text-muted-foreground">
                            {times.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {(
                                  (surveys.length > 0 ? surveys : times.map((t: number) => ({ time: t, id: undefined })))
                                ).map((s: any, i: number) => (
                                  s.id ? (
                                  <div key={i} className="flex items-center justify-between">
                                    <Link href={`/dashboard/surveys/${s.id}`} className="underline">
                                      - {formatDateTimeVN(s.time)}
                                    </Link>
                                    <Link href={`/dashboard/surveys/${s.id}`} className="inline-flex items-center justify-center text-foreground/70 hover:text-foreground" aria-label="Xem">
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </div>
                                  ) : (
                                    <span key={i}>- {formatDateTimeVN(s.time)}</span>
                                  )
                                ))}
                              </div>
                            ) : (
                              <span>Không có lần khảo sát nào</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {summary && (summary as any).summaryRows?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">Khong co du lieu</td>
                  </tr>
                )}
                {!summary && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">Dang tai tong hop...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent reports */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="hidden sm:flex items-center gap-1 rounded-md border p-1">
              <Button size="sm" variant={statusFilter === "all" ? "default" : "ghost"} onClick={() => setStatusFilter("all")}>Tất cả</Button>
              <Button size="sm" variant={statusFilter === "active" ? "default" : "ghost"} onClick={() => setStatusFilter("active")}>Đang dùng</Button>
              <Button size="sm" variant={statusFilter === "inactive" ? "default" : "ghost"} onClick={() => setStatusFilter("inactive")}>Tạm dừng</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Khoảng ngày</th>
                  <th className="py-2 pr-4">Sinh lúc</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList?.slice((page - 1) * pageSize, page * pageSize).map((r: any) => (
                  <tr key={String(r._id)} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.fromDay} - {r.toDay}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDateTimeVN(r.generatedAt)}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={r.active ? "inline-flex items-center gap-1 text-green-600" : "inline-flex items-center gap-1 text-gray-500"}
                      >
                        <BadgeCheck className="h-4 w-4" />
                        {r.active ? "Đang dùng" : "Tạm dừng"}
                      </span>
                    </td>
                    <td className="py-2 pr-0 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => onToggle(r._id as any, !r.active)}>
                          {r.active ? "Tắt" : "Kích hoạt"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(r._id as any)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/reports/${r._id}`}>Chi tiet</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList && filteredList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">Chưa có báo cáo</td>
                  </tr>
                )}
                {!filteredList && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">Đang tải danh sách...</td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredList && filteredList.length > 0 && (
              <Pagination page={page} total={filteredList.length} pageSize={pageSize} onPageChange={setPage} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
