"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { provinces, findProvince, findDistrict } from "@/lib/vn-locations";

export default function MarketCreatePage() {
  const router = useRouter();
  const create = useMutation(api.markets.create);
  const [name, setName] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [detail, setDetail] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const districts = useMemo(() => findProvince(provinceCode)?.districts ?? [], [provinceCode]);
  const wards = useMemo(() => findDistrict(provinceCode, districtCode)?.wards ?? [], [provinceCode, districtCode]);

  useEffect(() => {
    // reset downstream when selection changes
    setDistrictCode("");
    setWardCode("");
  }, [provinceCode]);
  useEffect(() => setWardCode("") , [districtCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await create({
        name,
        addressJson: {
          provinceCode: provinceCode || undefined,
          districtCode: districtCode || undefined,
          wardCode: wardCode || undefined,
          detail: detail || undefined,
        },
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
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
              >
                <option value="">-- Chọn tỉnh/thành --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Quận/Huyện</Label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={districtCode}
                onChange={(e) => setDistrictCode(e.target.value)}
                disabled={!provinceCode}
              >
                <option value="">-- Chọn quận/huyện --</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Phường/Xã</Label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={wardCode}
                onChange={(e) => setWardCode(e.target.value)}
                disabled={!districtCode}
              >
                <option value="">-- Chọn phường/xã --</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="detail">Địa chỉ chi tiết</Label>
              <Input id="detail" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Số nhà, đường..." />
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
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
