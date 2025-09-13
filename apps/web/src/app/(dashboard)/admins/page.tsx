"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Plus, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export default function AdminsListPage() {
  const [q, setQ] = useState("");
  const list = useQuery(api.admins.listBrief, {});
  const toggleActive = useMutation(api.admins.toggleActive);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "username">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [me, setMe] = useState<{ isSuper: boolean; superUsername?: string } | null>(null);

  // fetch current admin info to control permissions on UI
  useMemo(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { cache: 'no-store' });
        const j = await res.json().catch(() => ({}));
        if (j?.ok) setMe({ isSuper: !!j.isSuper, superUsername: j.superUsername || undefined });
        else setMe({ isSuper: false });
      } catch {
        setMe({ isSuper: false });
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!list) return undefined;
    let base = !q
      ? list
      : list.filter((a: any) => [a.username, a.name, a.phone ?? ""].some((t: string) => t.toLowerCase().includes(q.toLowerCase())));
    if (statusFilter !== "all") {
      const want = statusFilter === "active";
      base = base.filter((a: any) => !!a.active === want);
    }
    const sorted = [...base].sort((a: any, b: any) => {
      const av = (sortBy === "name" ? a.name : a.username) ?? "";
      const bv = (sortBy === "name" ? b.name : b.username) ?? "";
      const cmp = String(av).localeCompare(String(bv), "vi", { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [q, list, statusFilter, sortBy, sortDir]);

  const onToggle = async (id: string, next: boolean) => {
    try {
      await toggleActive({ id: id as any, active: next });
    } catch (err: any) {
      toast.error(err?.message ?? "Cập nhật trạng thái thất bại");
    }
  };

  const onDelete = async (id: string, username: string) => {
    if (!confirm(`Xóa quản trị viên ${username}?`)) return;
    const res = await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, username }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error || "Xóa thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Quản trị viên</h2>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-md border p-1">
            <Button size="sm" variant={statusFilter === "all" ? "default" : "ghost"} onClick={() => setStatusFilter("all")}>Tất cả</Button>
            <Button size="sm" variant={statusFilter === "active" ? "default" : "ghost"} onClick={() => setStatusFilter("active")}>Đang dùng</Button>
            <Button size="sm" variant={statusFilter === "inactive" ? "default" : "ghost"} onClick={() => setStatusFilter("inactive")}>Tạm tắt</Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm..." className="pl-8 w-64" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button asChild>
            <Link href="/dashboard/admins/new">
              <Plus className="mr-2 h-4 w-4" /> Thêm mới
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách quản trị viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline cursor-pointer select-none"
                      onClick={() => { setSortBy("username"); setSortDir((d) => d === "asc" ? "desc" : "asc"); }}
                      title="Sắp xếp theo tài khoản"
                    >
                      Tài khoản {sortBy === "username" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5"/> : <ArrowDown className="h-3.5 w-3.5"/>) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground"/>}
                    </button>
                  </th>
                  <th className="py-2 pr-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline cursor-pointer select-none"
                      onClick={() => { setSortBy("name"); setSortDir((d) => d === "asc" ? "desc" : "asc"); }}
                      title="Sắp xếp theo tên"
                    >
                      Họ tên {sortBy === "name" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5"/> : <ArrowDown className="h-3.5 w-3.5"/>) : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground"/>}
                    </button>
                  </th>
                  <th className="py-2 pr-4">Điện thoại</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((a: any) => (
                  <tr key={a._id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{a.username}</td>
                    <td className="py-2 pr-4">{a.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{a.phone ?? ""}</td>
                    <td className="py-2 pr-4">
                      <span className={a.active ? "text-green-600" : "text-gray-500"}>{a.active ? "Đang dùng" : "Tạm tắt"}</span>
                    </td>
                    <td className="py-2 pr-0">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onToggle(a._id as any, !a.active)}
                          disabled={Boolean(me?.superUsername && a.username === me.superUsername)}
                          title={me?.superUsername && a.username === me.superUsername ? 'Không thể tắt admin tối cao' : undefined}
                        >
                          {a.active ? "Tắt" : "Kích hoạt"}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/admins/${a._id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Sửa
                          </Link>
                        </Button>
                        {me?.isSuper && (!me.superUsername || a.username !== me.superUsername) && (
                          <Button size="sm" variant="destructive" onClick={() => onDelete(a._id as any, a.username)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
                          </Button>
                        )}
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
