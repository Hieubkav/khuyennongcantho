"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function KhaoSatHome() {
  const [me, setMe] = useState<{ sub: string; username: string; name?: string } | null>(null);
  useEffect(() => {
    fetch("/api/member/me").then((r) => r.json()).then((j) => {
      if (j?.ok) setMe({ sub: j.sub, username: j.username, name: j.name ?? undefined });
    }).catch(() => {});
  }, []);
  const markets = useQuery(api.members.markets as any, me ? { memberId: me.sub as any, activeOnly: true } as any : "skip" as any);
  const create = useMutation(api.surveys.createForMarket);

  const onCreate = async (marketId: string) => {
    if (!me) return;
    try {
      const s = await create({ marketId: marketId as any, memberId: me.sub as any, copyFromPrevious: true } as any);
      toast.success("Đã tạo phiếu khảo sát");
      location.href = `/khaosat/${(s as any)._id}`;
    } catch (e: any) {
      toast.error(e?.message ?? "Tạo thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Khảo sát giá</h2>
        <Button asChild variant="outline"><Link href="/khaosat/lich-su">Lịch sử</Link></Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Chợ được phân công</CardTitle>
        </CardHeader>
        <CardContent>
          {!markets && <div className="text-sm text-muted-foreground">Đang tải...</div>}
          {markets && (markets as any[]).length === 0 && (
            <div className="text-sm text-muted-foreground">Chưa được phân công chợ nào.</div>
          )}
          <div className="grid gap-3">
            {(markets as any[] | undefined)?.map((m) => (
              <div key={String(m._id)} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="font-medium">{m.name}</div>
                </div>
                <Button size="sm" onClick={() => onCreate(m._id as any)}>Tạo khảo sát</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

