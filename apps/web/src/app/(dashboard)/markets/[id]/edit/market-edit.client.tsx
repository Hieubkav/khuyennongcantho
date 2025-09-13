"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { SelectSearch } from "@/components/ui/select-search";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { provinces, wardsOfProvince } from "@/lib/vn-locations";
import { useRouter } from "next/navigation";

export default function MarketEditClient({ id }: { id: string }) {
  const router = useRouter();
  const list = useQuery(api.markets.listBrief, {});
  const update = useMutation(api.markets.update);
  const membersAll = useQuery(api.members.listBrief, {});
  const assignedMembers = useQuery(api.assignments.listByMarket, { marketId: id as any });
  const doAssign = useMutation(api.assignments.assign);
  const doUnassign = useMutation(api.assignments.unassign);

  const current = useMemo(() => list?.find((m) => String(m._id) === String(id)), [list, id]);

  const [name, setName] = useState<string>("");
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [wardCode, setWardCode] = useState<string>("");
  const [qProv, setQProv] = useState<string>("");
  const [qWard, setQWard] = useState<string>("");
  const [detail, setDetail] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (current) {
      setName(current.name ?? "");
      setProvinceCode(current.addressJson?.provinceCode ?? "");
      setWardCode(current.addressJson?.wardCode ?? "");
      setDetail(current.addressJson?.detail ?? "");
      setNote((current as any).note ?? "");
    }
  }, [current?._id]);

  const wards = useMemo(() => wardsOfProvince(provinceCode), [provinceCode]);
  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: String(p.id), label: p.name })),
    []
  );
  const wardOptions = useMemo(
    () => wards.map((w) => ({ value: String(w.id), label: w.name })),
    [wards]
  );

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
          wardCode: wardCode || undefined,
          detail: detail || undefined,
        } as any,
        note: note || undefined,
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
    <div className="mx-auto w-full max-w-3xl space-y-6">
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
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard/markets">Hủy</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                try {
                  setSaving(true);
                  await update({
                    id: current._id as any,
                    name,
                    addressJson: {
                      provinceCode: provinceCode || undefined,
                      wardCode: wardCode || undefined,
                      detail: detail || undefined,
                    } as any,
                    note: note || undefined,
                  } as any);
                  router.push("/dashboard/markets/new");
                } catch (err: any) {
                  toast.error(err?.message ?? "Cập nhật thất bại");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu & tạo mới"}
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Phân công nhân viên (Members)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {assignedMembers ? (
              <span>Hiện phân công: {assignedMembers.length} nhân viên</span>
            ) : (
              <span>Đang tải danh sách phân công...</span>
            )}
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">Chọn nhân viên phân công</div>
            <ScrollArea className="h-64 rounded-md border p-2">
              <div className="grid gap-2">
                {membersAll?.map((m: any) => {
                  const checked = !!assignedMembers?.find((x: any) => String(x._id) === String(m._id));
                  return (
                    <label key={String(m._id)} className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={async (val) => {
                          try {
                            if (val) await doAssign({ marketId: id as any, memberId: m._id as any });
                            else await doUnassign({ marketId: id as any, memberId: m._id as any });
                          } catch (err: any) {
                            toast.error(err?.message ?? "Cập nhật phân công thất bại");
                          }
                        }}
                      />
                      <span className="text-sm">{m.name} <span className="text-muted-foreground">({m.username})</span></span>
                    </label>
                  );
                })}
                {membersAll && membersAll.length === 0 && (
                  <div className="text-sm text-muted-foreground">Chưa có nhân viên nào.</div>
                )}
                {!membersAll && <div className="text-sm text-muted-foreground">Đang tải danh sách nhân viên...</div>}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

