"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
  const current = useQuery(api.settings.get, {} as any);
  const save = useMutation(api.settings.save);

  const [siteName, setSiteName] = useState("Khuyến Nông Cần Thơ");
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    if (current) {
      setSiteName(current.siteName ?? "Khuyến Nông Cần Thơ");
      setPageSize(current.pageSize ?? 10);
    }
  }, [current]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({ siteName, pageSize });
      toast.success("Đã lưu cài đặt");
    } catch (err: any) {
      toast.error(err?.message ?? "Lưu cài đặt thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Cài đặt</h2>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="text-sm font-medium">Tên website</label>
              <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Tên website" />
            </div>
            <div>
              <label className="text-sm font-medium">Số bản ghi mỗi trang</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value || 10))}
              />
            </div>
            <div className="pt-2">
              <Button type="submit">Lưu</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

