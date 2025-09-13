"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SurveysListPage() {
  const [fromDay, setFromDay] = useState(today());
  const [toDay, setToDay] = useState(today());
  const markets = useQuery(api.markets.listBrief, {});
  const members = useQuery(api.members.listBrief, {});
  const [marketId, setMarketId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");
  const list = useQuery(api.surveys.listByRange as any, {
    fromDay,
    toDay,
    marketId: marketId ? (marketId as any) : undefined,
    memberId: memberId ? (memberId as any) : undefined,
    limit: 200,
  } as any);
  const doDelete = useMutation(api.surveys.deleteCascade);

  const filtered = useMemo(() => list, [list]);

  const onDelete = async (id: string) => {
    try {
      await doDelete({ id: id as any });
      toast.success("Đã xóa");
    } catch (err: any) {
      toast.error(err?.message ?? "Xóa thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <div className="text-sm text-muted-foreground">Từ ngày</div>
          <Input type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Đến ngày</div>
          <Input type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Chợ</div>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={marketId} onChange={(e) => setMarketId(e.target.value)}>
            <option value="">-- Tất cả --</option>
            {markets?.map((m: any) => (
              <option key={String(m._id)} value={String(m._id)}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Nhân viên</div>
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">-- Tất cả --</option>
            {members?.map((m: any) => (
              <option key={String(m._id)} value={String(m._id)}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="ms-auto">
          <Button asChild>
            <Link href="/dashboard/surveys/new">
              <Plus className="mr-2 h-4 w-4" /> Tạo đợt lấy giá
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đợt lấy giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Ngày</th>
                  <th className="py-2 pr-4">Chợ</th>
                  <th className="py-2 pr-4">Nhân viên</th>
                  <th className="py-2 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((s: any) => (
                  <tr key={String(s._id)} className="border-b last:border-0">
                    <td className="py-2 pr-4">{s.surveyDay}</td>
                    <td className="py-2 pr-4">{s.marketName ?? ""}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{s.memberName ?? ""}</td>
                    <td className="py-2 pr-0 text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/surveys/${s._id}`}>Sửa</Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(s._id as any)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">Không có dữ liệu</td>
                  </tr>
                )}
                {!filtered && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">Đang tải...</td>
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
