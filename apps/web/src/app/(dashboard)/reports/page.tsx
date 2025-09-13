"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
  const list = useQuery(api.reports.listBrief, { limit: 20 });
  const admins = useQuery(api.admins.listBrief, {} as any);
  const generate = useMutation(api.reports.generateRange);

  const [meUsername, setMeUsername] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((j) => setMeUsername(j?.ok ? j.username : null))
      .catch(() => setMeUsername(null));
  }, []);

  const myAdminId = useMemo(() => {
    if (!admins || !meUsername) return null;
    const me = admins.find((a: any) => a.username === meUsername);
    return me?._id ?? null;
  }, [admins, meUsername]);

  const onGenerate = async () => {
    try {
      if (!myAdminId) {
        toast.error("Không xác định admin hiện tại");
        return;
      }
      const rep = await generate({ fromDay, toDay, createdByAdminId: myAdminId as any });
      toast.success("Đã tạo báo cáo");
      location.href = `/dashboard/reports/${(rep as any)._id}`;
    } catch (err: any) {
      toast.error(err?.message ?? "Tạo báo cáo thất bại");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tổng hợp theo khoảng ngày</CardTitle>
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
                  <th className="py-2 pr-4">Chợ</th>
                  <th className="py-2 pr-4">Nhân viên</th>
                  <th className="py-2 pr-4">Số bảng</th>
                  <th className="py-2 pr-4">Bảng đầy đủ</th>
                </tr>
              </thead>
              <tbody>
                {summary?.summaryRows?.map((r: any) => (
                  <tr key={String(r.marketId)} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.marketName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{(r.memberNames || []).join(", ")}</td>
                    <td className="py-2 pr-4">{r.surveyCount}</td>
                    <td className="py-2 pr-4">{r.filledCount}</td>
                  </tr>
                ))}
                {summary && summary.summaryRows?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td>
                  </tr>
                )}
                {!summary && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">Đang tải tổng hợp...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Báo cáo gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Khoảng ngày</th>
                  <th className="py-2 pr-4">Sinh lúc</th>
                  <th className="py-2 pr-4 text-right">Xem</th>
                </tr>
              </thead>
              <tbody>
                {list?.map((r: any) => (
                  <tr key={String(r._id)} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.fromDay} - {r.toDay}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{new Date(r.generatedAt).toLocaleString()}</td>
                    <td className="py-2 pr-0 text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/reports/${r._id}`}>Chi tiết</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {list && list.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">Chưa có báo cáo</td>
                  </tr>
                )}
                {!list && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">Đang tải danh sách...</td>
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

