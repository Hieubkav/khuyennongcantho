"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectSearch } from "@/components/ui/select-search";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { provinces, wardsOfProvince } from "@/lib/vn-locations";

export default function MarketCreatePage() {
  const router = useRouter();
  const create = useMutation(api.markets.create);
  const [name, setName] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [detail, setDetail] = useState("");
  const [note, setNote] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const wards = useMemo(() => wardsOfProvince(provinceCode), [provinceCode]);
  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: String(p.id), label: p.name })),
    []
  );
  const wardOptions = useMemo(
    () => wards.map((w) => ({ value: String(w.id), label: w.name })),
    [wards]
  );

  useEffect(() => {
    setWardCode("");
  }, [provinceCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await create({
        name,
        addressJson: {
          provinceCode: provinceCode || undefined,
          wardCode: wardCode || undefined,
          detail: detail || undefined,
        },
        note: note || undefined,
        order,
        active: true,
      });
      toast.success("Đã tạo chợ");
      router.push("/dashboard/markets");
    } catch (err: any) {
      toast.error(err?.message ?? "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onSubmitAndNew = async () => {
    try {
      setSaving(true);
      await create({
        name,
        addressJson: {
          provinceCode: provinceCode || undefined,
          wardCode: wardCode || undefined,
          detail: detail || undefined,
        },
        note: note || undefined,
        order,
        active: true,
      });
      toast.success("Đã tạo, tiếp tục tạo mới");
      setName("");
      setDetail("");
      setNote("");
      setOrder(0);
      // giữ nguyên chọn tỉnh/xã để thao tác nhanh
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
            <CardTitle>Thêm chợ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Tỉnh/Thành phố</Label>
              <SelectSearch
                options={provinceOptions}
                value={provinceCode}
                onChange={(v) => {
                  setProvinceCode(v);
                  setWardCode("");
                }}
                placeholder="Chọn tỉnh/thành"
              />
            </div>
            <div className="grid gap-2">
              <Label>Phường/Xã</Label>
              <SelectSearch
                options={wardOptions}
                value={wardCode}
                onChange={setWardCode}
                placeholder="Chọn phường/xã"
                disabled={!provinceCode}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="detail">Địa chỉ chi tiết</Label>
              <Input id="detail" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Số nhà, đường..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú thêm" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Thứ tự</Label>
              <Input id="order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard/markets">Hủy</Link>
            </Button>
            <Button type="button" variant="secondary" onClick={onSubmitAndNew} disabled={saving}>{saving ? "Đang lưu..." : "Lưu & tạo mới"}</Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

