"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Edit, Plus, Search, Trash2, GripVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export default function ProductsListPage() {
  const [q, setQ] = useState("");
  const products = useQuery(api.products.listWithUnits, {});
  const doDelete = useMutation(api.products.safeDelete);
  const toggleActive = useMutation(api.products.toggleActive);
  const doReorder = useMutation(api.products.reorder);

  const [list, setList] = useState<any[] | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [sortBy, setSortBy] = useState<"order" | "name">("order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const allowDrag = !q.trim() && sortBy === "order" && statusFilter === "all";

  useEffect(() => {
    if (products) setList(products);
    else setList(undefined);
  }, [products]);

  const filtered = useMemo(() => {
    if (!list) return undefined;
    let base = !q
      ? list
      : list.filter((p) => [p.name, p.unit?.name ?? "", p.unit?.abbr ?? ""].some((t) => t.toLowerCase().includes(q.toLowerCase())));
    if (statusFilter !== "all") {
      const wantActive = statusFilter === "active";
      base = base.filter((p) => !!p.active === wantActive);
    }
    if (sortBy === "name") {
      const sorted = [...base].sort((a, b) => {
        const an = (a.name ?? "").toString();
        const bn = (b.name ?? "").toString();
        const cmp = an.localeCompare(bn, "vi", { sensitivity: "base" });
        return sortDir === "asc" ? cmp : -cmp;
      });
      return sorted;
    }
    return base;
  }, [q, list, sortBy, sortDir, statusFilter]);

  const onDelete = async (id: string, name: string) => {
    try {
      const res = await doDelete({ id: id as any });
      if (res && typeof res === "object" && "success" in res && !res.success) {
        // Xây nội dung chi tiết nếu server trả về refs
        const refs: any[] | undefined = (res as any).refs;
        if (Array.isArray(refs) && refs.length > 0) {
          const labelMap: Record<string, string> = {
            surveyItems: "Dòng khảo sát",
            reportItems: "Dòng báo cáo",
          };
          const Description = (
            <div className="space-y-2">
              <div className="text-sm">
                Sản phẩm đang được sử dụng bởi các dữ liệu sau. Vui lòng xóa/cập nhật các bản ghi này trước khi xóa sản phẩm.
              </div>
              <ul className="list-disc list-inside space-y-1">
                {refs.map((r: any) => {
                  const table: string = r.table || "unknown";
                  const count: number = r.count ?? 0;
                  const samples: any[] = Array.isArray(r.samples) ? r.samples : [];
                  const labels = samples.map((s: any) => {
                    const day = s?.surveyDay ? String(s.surveyDay) : "";
                    const market = s?.marketName || (s?.marketId ? String(s.marketId) : "");
                    if (day && market) return `${day} – ${market}`;
                    return day || market || "...";
                  });
                  const extra = Math.max(0, count - labels.length);
                  const head = `${labelMap[table] ?? table}: ${count} bản ghi`;
                  return (
                    <li key={`${table}-${count}`}>
                      <div className="font-medium">{head}</div>
                      {labels.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Ví dụ: {labels.join(", ")}{extra > 0 ? ` … (+${extra})` : ""}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
          toast.error("Không thể xóa sản phẩm", { description: Description });
        } else {
          const reason = (res as any).message ||
            "Không thể xóa sản phẩm vì đang được tham chiếu";
          toast.error(reason);
        }
        return;
      }
      toast.success(`Đã xóa sản phẩm: ${name}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Xóa thất bại (có thể đang được tham chiếu)");
    }
  };

  const onToggle = async (id: string, next: boolean) => {
    try {
      await toggleActive({ id: id as any, active: next });
    } catch (err: any) {
      toast.error(err?.message ?? "Cập nhật trạng thái thất bại");
    }
  };

  function arrayMove<T>(arr: T[], from: number, to: number) {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }

  const onDropReorder = async (sourceId: string, targetId: string) => {
    if (!list || !allowDrag) return;
    const from = list.findIndex((p) => String(p._id) === String(sourceId));
    const to = list.findIndex((p) => String(p._id) === String(targetId));
    if (from < 0 || to < 0 || from === to) return;
    const newList = arrayMove(list, from, to);
    setList(newList);
    try {
      await doReorder({ items: newList.map((p, idx) => ({ id: p._id as any, order: idx })) });
    } catch (err: any) {
      toast.error(err?.message ?? "Sắp xếp thất bại");
    }
  };

  const toggleSortName = () => {
    if (sortBy !== "name") {
      setSortBy("name");
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };
  const resetSortOrder = () => {
    setSortBy("order");
    setSortDir("asc");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Sản phẩm</h2>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-md border p-1">
            <Button size="sm" variant={statusFilter === "all" ? "default" : "ghost"} onClick={() => setStatusFilter("all")}>Tất cả</Button>
            <Button size="sm" variant={statusFilter === "active" ? "default" : "ghost"} onClick={() => setStatusFilter("active")}>Đang dùng</Button>
            <Button size="sm" variant={statusFilter === "inactive" ? "default" : "ghost"} onClick={() => setStatusFilter("inactive")}>Tạm tắt</Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-8 w-64"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" /> Thêm mới
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 w-10">&nbsp;</th>
                  <th className="py-2 pr-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline cursor-pointer select-none"
                      onClick={toggleSortName}
                      title="Sắp xếp theo tên"
                    >
                      Tên
                      {sortBy === "name" ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="py-2 pr-4">Đơn vị</th>
                  <th className="py-2 pr-4">
                    <button
                      type="button"
                      className="hover:underline cursor-pointer select-none"
                      onClick={resetSortOrder}
                      title="Hiển thị theo thứ tự đã sắp xếp"
                    >
                      Thứ tự
                    </button>
                  </th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b last:border-0"
                    draggable={allowDrag}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(p._id));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => allowDrag && e.preventDefault()}
                    onDrop={(e) => {
                      if (!allowDrag) return;
                      e.preventDefault();
                      const sourceId = e.dataTransfer.getData("text/plain");
                      onDropReorder(sourceId, String(p._id));
                    }}
                  >
                    <td className="py-2 pr-4 align-middle">
                      <span
                        className={"inline-flex h-6 w-6 items-center justify-center cursor-grab text-muted-foreground select-none"}
                        title={
                          allowDrag
                            ? "Kéo để sắp xếp"
                            : "Xóa tìm kiếm, hiển thị Tất cả và chọn Thứ tự để sắp xếp"
                        }
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-medium">{p.name}</td>
                    <td className="py-2 pr-4">{p.unit ? (p.unit.abbr ? `${p.unit.abbr} (${p.unit.name})` : p.unit.name) : "-"}</td>
                    <td className="py-2 pr-4">{p.order ?? 0}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          p.active
                            ? "inline-flex items-center gap-1 text-green-600"
                            : "inline-flex items-center gap-1 text-gray-500"
                        }
                      >
                        <BadgeCheck className="h-4 w-4" />
                        {p.active ? "Đang dùng" : "Tạm tắt"}
                      </span>
                    </td>
                    <td className="py-2 pr-0">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => onToggle(p._id as any, !p.active)}>
                          {p.active ? "Tắt" : "Kích hoạt"}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/products/${p._id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Sửa
                          </Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(p._id as any, p.name)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered !== undefined && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
                {filtered === undefined && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Đang tải...
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
