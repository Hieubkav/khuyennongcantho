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

export default function UnitEditClient({ id }: { id: string }) {
  const list = useQuery(api.units.listBrief, {});
  const update = useMutation(api.units.update);

  const current = useMemo(() => list?.find((u) => String(u._id) === String(id)), [list, id]);

  const [name, setName] = useState<string>(current?.name ?? "");
  const [abbr, setAbbr] = useState<string>(current?.abbr ?? "");
  const [order, setOrder] = useState<number>(current?.order ?? 0);
  const [saving, setSaving] = useState(false);

  // hydrate initial values when data loads
  useEffect(() => {
    if (current) {
      setName(current.name ?? "");
      setAbbr(current.abbr ?? "");
      setOrder(current.order ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?._id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    try {
      setSaving(true);
      await update({ id: current._id as any, name, abbr: abbr || undefined, order });
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
        Không tìm thấy. Quay lại <Link className="underline" href="/dashboard/units">danh sách</Link>.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa đơn vị</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="abbr">Viết tắt</Label>
              <Input id="abbr" value={abbr} onChange={(e) => setAbbr(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Thứ tự</Label>
              <Input
                id="order"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard/units">Hủy</Link>
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
