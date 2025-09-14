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
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

export default function ReportEditClient({ id }: { id: string }) {
  const router = useRouter();
  const list = useQuery(api.reports.listBrief, {} as any);
  const update = useMutation(api.reports.update);
  const toggleActive = useMutation(api.reports.toggleActive);

  const current = useMemo(() => list?.find((r: any) => String(r._id) === String(id)), [list, id]);

  const [fromDay, setFromDay] = useState<string>("");
  const [toDay, setToDay] = useState<string>("");
  const [active, setActive] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (current) {
      setFromDay(current.fromDay ?? "");
      setToDay(current.toDay ?? "");
      setActive(current.active ?? true);
    }
  }, [current?._id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    try {
      setSaving(true);
      await update({
        id: current._id as any,
        fromDay,
        toDay,
      } as any);
      toast.success("Đã cập nhật");
    } catch (err: any) {
      toast.error(err?.message ?? "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (checked: boolean) => {
    if (!current) return;
    try {
      await toggleActive({ id: current._id as any, active: checked });
      setActive(checked);
      toast.success(`Đã ${checked ? "kích hoạt" : "tắt"} báo cáo`);
    } catch (err: any) {
      toast.error(err?.message ?? "Cập nhật trạng thái thất bại");
    }
  };

  if (list === undefined) {
    return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  }
  if (!current) {
    return (
      <div className="text-sm text-muted-foreground">
        Không tìm thấy. Quay lại <Link className="underline" href="/dashboard/reports">danh sách</Link>.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa báo cáo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fromDay">Từ ngày</Label>
              <Input 
                id="fromDay" 
                type="date" 
                value={fromDay} 
                onChange={(e) => setFromDay(e.target.value)} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="toDay">Đến ngày</Label>
              <Input 
                id="toDay" 
                type="date" 
                value={toDay} 
                onChange={(e) => setToDay(e.target.value)} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="active">Trạng thái</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={onToggleActive}
                />
                <span>{active ? "Đang dùng" : "Tạm tắt"}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard/reports">Hủy</Link>
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