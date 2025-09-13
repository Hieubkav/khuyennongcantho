"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function MembersListPage() {
  const [q, setQ] = useState("");
  const list = useQuery(api.members.listBrief, {});
  const toggleActive = useMutation(api.members.toggleActive);

  const filtered = useMemo(() => {
    if (!list) return undefined;
    if (!q) return list;
    const s = q.toLowerCase();
    return list.filter((m: any) => [m.username, m.name, m.phone ?? ""].some((t: string) => t.toLowerCase().includes(s)));
  }, [q, list]);

  const onToggle = async (id: string, next: boolean) => {
    try {
      await toggleActive({ id: id as any, active: next });
    } catch (err: any) {
      toast.error(err?.message ?? "Cập nhật trạng thái thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Nhân viên khảo sát</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm..." className="pl-8 w-64" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button asChild>
            <Link href="/dashboard/members/new">
              <Plus className="mr-2 h-4 w-4" /> Thêm mới
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Tài khoản</th>
                  <th className="py-2 pr-4">Họ tên</th>
                  <th className="py-2 pr-4">Điện thoại</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((m: any) => (
                  <tr key={m._id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{m.username}</td>
                    <td className="py-2 pr-4">{m.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{m.phone ?? ""}</td>
                    <td className="py-2 pr-4">
                      <span className={m.active ? "text-green-600" : "text-gray-500"}>{m.active ? "Đang dùng" : "Tạm tắt"}</span>
                    </td>
                    <td className="py-2 pr-0">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => onToggle(m._id as any, !m.active)}>
                          {m.active ? "Tắt" : "Kích hoạt"}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/members/${m._id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Sửa
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered !== undefined && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">Không có dữ liệu</td>
                  </tr>
                )}
                {filtered === undefined && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">Đang tải...</td>
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

