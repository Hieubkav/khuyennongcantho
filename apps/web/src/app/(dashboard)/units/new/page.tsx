"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UnitCreatePage() {
  const router = useRouter();
  const create = useMutation(api.units.create);
  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await create({ name, abbr: abbr || undefined, order });
      toast.success("Đã tạo đơn vị");
      router.push("/dashboard/units");
    } catch (err: any) {
      toast.error(err?.message ?? "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onSubmitAndNew = async () => {
    try {
      setSaving(true);
      await create({ name, abbr: abbr || undefined, order });
      toast.success("Đã tạo, tiếp tục tạo mới");
      setName("");
      setAbbr("");
      setOrder(0);
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
            <CardTitle>Thêm đơn vị</CardTitle>
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
              <Input id="order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard/units">Hủy</Link>
            </Button>
            <Button type="button" variant="secondary" onClick={onSubmitAndNew} disabled={saving}>{saving ? "Đang lưu..." : "Lưu & tạo mới"}</Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

