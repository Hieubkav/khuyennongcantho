"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProductEditClient({ id }: { id: string }) {
  const list = useQuery(api.products.listWithUnits, {});
  const units = useQuery(api.units.listBrief, {});
  const update = useMutation(api.products.update);

  const current = useMemo(() => list?.find((p) => String(p._id) === String(id)), [list, id]);

  const [name, setName] = useState<string>("");
  const [unitId, setUnitId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (current) {
      setName(current.name ?? "");
      setUnitId(String(current.unitId));
      setNote(current.note ?? "");
      setOrder(current.order ?? 0);
    }
  }, [current?._id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    try {
      if (!unitId) return toast.error("Vui lòng chọn đơn vị");
      setSaving(true);
      await update({ id: current._id as any, name, unitId: unitId as any, note: note || undefined, order });
      toast.success("Đã cập nhật");
    } catch (err: any) {
      toast.error(err?.message ?? "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (list === undefined) {
    return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  }
  if (!current) {
    return (
      <div className="text-sm text-muted-foreground">
        Không tìm thấy. Quay lại <Link className="underline" href="/products">danh sách</Link>.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <select
                id="unit"
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                required
              >
                <option value="" disabled>
                  {units === undefined ? "Đang tải..." : "-- Chọn đơn vị --"}
                </option>
                {units?.map((u) => (
                  <option key={u._id} value={String(u._id)}>
                    {u.abbr ? `${u.abbr} (${u.name})` : u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Thứ tự</Label>
              <Input id="order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/products">Hủy</Link>
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

