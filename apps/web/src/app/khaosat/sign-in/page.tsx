"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function SignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/khaosat";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("/api/member/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error || "Đăng nhập thất bại");
        return;
      }
      router.replace(next as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm py-10">
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập Khảo sát</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm">Tài khoản</label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm">Mật khẩu</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default function MemberSignInPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-sm py-10 text-sm text-muted-foreground">Đang tải...</div>}>
      <SignInForm />
    </Suspense>
  );
}

