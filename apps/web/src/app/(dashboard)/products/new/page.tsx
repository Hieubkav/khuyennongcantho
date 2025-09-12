"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProductCreatePage() {
  const router = useRouter();
  const create = useMutation(api.products.create);
  const units = useQuery(api.units.listBrief, {});

  const [name, setName] = useState("");
  const [unitId, setUnitId] = useState("");
  const [note, setNote] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!unitId) return toast.error("Vui lòng chọn đơn vị");
      setSaving(true);
      await create({ name, unitId: unitId as any, note: note || undefined, order });
      toast.success("Đã tạo sản phẩm");
      router.push("/products");
    } catch (err: any) {
      toast.error(err?.message ?? "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Thêm sản phẩm</CardTitle>
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
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

