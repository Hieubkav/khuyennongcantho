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
import { provinces, findProvince, findDistrict } from "@/lib/vn-locations";

export default function MarketEditClient({ id }: { id: string }) {
  const list = useQuery(api.markets.listBrief, {});
  const update = useMutation(api.markets.update);

  const current = useMemo(() => list?.find((m) => String(m._id) === String(id)), [list, id]);

  const [name, setName] = useState<string>("");
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [districtCode, setDistrictCode] = useState<string>("");
  const [wardCode, setWardCode] = useState<string>("");
  const [detail, setDetail] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (current) {
      setName(current.name ?? "");
      setProvinceCode(current.addressJson?.provinceCode ?? "");
      setDistrictCode(current.addressJson?.districtCode ?? "");
      setWardCode(current.addressJson?.wardCode ?? "");
      setDetail(current.addressJson?.detail ?? "");
    }
  }, [current?._id]);

  const districts = useMemo(() => findProvince(provinceCode)?.districts ?? [], [provinceCode]);
  const wards = useMemo(() => findDistrict(provinceCode, districtCode)?.wards ?? [], [provinceCode, districtCode]);

  useEffect(() => {
    setDistrictCode("");
    setWardCode("");
  }, [provinceCode]);
  useEffect(() => setWardCode("") , [districtCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    try {
      setSaving(true);
      await update({
        id: current._id as any,
        name,
        addressJson: {
          provinceCode: provinceCode || undefined,
          districtCode: districtCode || undefined,
          wardCode: wardCode || undefined,
          detail: detail || undefined,
        } as any,
      } as any);
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
        Không tìm thấy. Quay lại <Link className="underline" href="/dashboard/markets">danh sách</Link>.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa chợ</CardTitle>
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
