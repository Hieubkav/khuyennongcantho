"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function LichSuKhaoSat() {
  const [me, setMe] = useState<{ sub: string; username: string; name?: string } | null>(null);
  useEffect(() => {
    fetch("/api/member/me")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setMe({ sub: j.sub, username: j.username, name: j.name ?? undefined });
      })
      .catch(() => {});
  }, []);
  const [fromDay, setFromDay] = useState(today());
  const [toDay, setToDay] = useState(today());
  const list = useQuery(
    api.members.surveysInRange as any,
    me ? ({ memberId: me.sub as any, fromDay, toDay } as any) : ("skip" as any)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử khảo sát giá nông sản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <div className="text-sm text-muted-foreground">Chọn từ ngày</div>
              <Input type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Chọn đến ngày</div>
              <Input type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Ngày khảo sát</th>
                  <th className="py-2 pr-4">Chợ khảo sát</th>
                  <th className="py-2 pr-4">Đã gửi</th>
                  <th className="py-2 pr-4 text-right">Xem chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {(list as any[] | undefined)?.map((s) => (
                  <tr key={String(s._id)} className="border-b last:border-0">
                    <td className="py-2 pr-4">{s.surveyDay}</td>
                    <td className="py-2 pr-4">{s.marketName ?? "-"}</td>
                    <td className="py-2 pr-4">{String(!!(s as any).active)}</td>
                    <td className="py-2 pr-0 text-right">
                      <Link className="underline" href={`/khaosat/${s._id}`}>
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
                {list && (list as any[]).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Không có dữ liệu khảo sát
                    </td>
                  </tr>
                )}
                {!list && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Đang tải dữ liệu khảo sát...
                    </td>
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

