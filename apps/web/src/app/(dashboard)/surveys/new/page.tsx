"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SurveyCreatePage() {
  const router = useRouter();
  const markets = useQuery(api.markets.listBrief, {});
  const members = useQuery(api.members.listBrief, {});
  const create = useMutation(api.surveys.createForMarket);

  const [marketId, setMarketId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");
  const [surveyDay, setSurveyDay] = useState<string>(today());
  const [copyPrev, setCopyPrev] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketId || !memberId) return toast.error("Vui lòng chọn chợ và nhân viên");
    try {
      setSaving(true);
      const sv = await create({
        marketId: marketId as any,
        memberId: memberId as any,
        surveyDay,
        copyFromPrevious: copyPrev,
      } as any);
      toast.success("Đã tạo đợt lấy giá thành công");
      router.push(`/dashboard/surveys/${(sv as any)._id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Tạo đợt lấy giá thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Tạo đợt khảo sát giá</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Chọn chợ</Label>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" value={marketId} onChange={(e) => setMarketId(e.target.value)}>
                <option value="">-- Chọn chợ --</option>
                {markets?.map((m: any) => (
                  <option key={String(m._id)} value={String(m._id)}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Chọn nhân viên</Label>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="">-- Chọn nhân viên --</option>
                {members?.map((m: any) => (
                  <option key={String(m._id)} value={String(m._id)}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Ngày</Label>
              <Input type="date" value={surveyDay} onChange={(e) => setSurveyDay(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input id="copyPrev" type="checkbox" checked={copyPrev} onChange={(e) => setCopyPrev(e.target.checked)} />
              <Label htmlFor="copyPrev">Sao chép giá từ đợt gần nhất cùng chợ</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Đang tạo đợt khảo sát..." : "Tạo đợt khảo sát"}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

