"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminEditClient({ id }: { id: string }) {
  const list = useQuery(api.admins.listBrief, {});
  const update = useMutation(api.admins.update);
  const current = useMemo(() => list?.find((x: any) => String(x._id) === String(id)), [list, id]);

  const [username] = useState<string>(current?.username ?? "");
  const [name, setName] = useState<string>(current?.name ?? "");
  const [phone, setPhone] = useState<string>(current?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  if (!list) return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  if (!current)
    return (
      <div className="text-sm text-muted-foreground">
        Không tìm thấy. Quay lại <Link className="underline" href="/dashboard/admins">danh sách</Link>.
      </div>
    );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await update({ id: current._id as any, name, phone: phone || undefined });
      if (newPassword) {
        const res = await fetch("/api/admin/change-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: current._id, newPassword }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j?.error || "Đổi mật khẩu thất bại");
          return;
        }
      }
      toast.success("Đã cập nhật");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Sửa quản trị viên</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Tài khoản</Label>
              <Input value={username} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Họ tên</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newpass">Mật khẩu mới (tuỳ chọn)</Label>
              <Input id="newpass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard/admins">Hủy</Link>
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

