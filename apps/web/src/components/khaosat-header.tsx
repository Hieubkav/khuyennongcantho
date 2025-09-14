"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function KhaosatHeader() {
  const [me, setMe] = useState<{ name?: string; username: string } | null>(null);
  useEffect(() => {
    fetch("/api/member/me")
      .then((r) => r.json())
      .then((j) => { if (j?.ok) setMe({ name: j.name ?? undefined, username: j.username }); })
      .catch(() => {});
  }, []);

  const onLogout = async () => {
    await fetch("/api/member/logout", { method: "POST" });
    location.href = "/khaosat/sign-in";
  };

  return (
    <header className="w-full border-b bg-white/80 supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src="https://kndvnn.cantho.vn/favicon-96x96.png" alt="Logo" className="h-8 w-8 rounded" />
          <div className="leading-tight">
            <div className="font-semibold">Khảo sát giá nông sản</div>
            <div className="text-xs text-muted-foreground">TT Khuyến nông & DVNN Cần Thơ</div>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-3 text-sm">
          <Link className="hover:underline" href="/khaosat">Chợ được phân công</Link>
          <Link className="hover:underline" href="/khaosat/lich-su">Lịch sử</Link>
        </nav>
        <div className="flex items-center gap-2">
          {me ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">{me.name || me.username}</span>
              <Button size="sm" variant="outline" onClick={onLogout}>Đăng xuất</Button>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/khaosat/sign-in">Đăng nhập</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function KhaosatFooter() {
  return (
    <footer className="w-full border-t mt-8">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground grid gap-1">
        <div>
          Trang web Khuyến nông và Dịch vụ Nông nghiệp Cần Thơ: {" "}
          <a className="underline" href="https://kndvnn.cantho.vn/" target="_blank" rel="noreferrer">kndvnn.cantho.vn</a>
        </div>
        <div>Tên đơn vị: Trung tâm Khuyến nông và Dịch vụ Nông nghiệp TP. Cần Thơ (Can Tho CAES)</div>
        <div>Địa chỉ: Số 51, Đường CMT8, phường Cái Khế, TP. Cần Thơ</div>
        <div>Điện thoại: 02923.861.176 — Email: kndvnncantho@gmail.com</div>
      </div>
    </footer>
  );
}
