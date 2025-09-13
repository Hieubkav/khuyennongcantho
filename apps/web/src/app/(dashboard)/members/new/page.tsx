"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MemberCreatePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/members/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, name, phone, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error || "Tạo thất bại");
        return;
      }
      toast.success("Đã tạo nhân viên");
      router.push("/dashboard/members");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Thêm nhân viên</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Tài khoản</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
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
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/dashboard/members">Hủy</Link>
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

