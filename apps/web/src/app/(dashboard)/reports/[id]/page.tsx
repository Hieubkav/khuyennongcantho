"use client";

import { use, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = use(params);
  const id = p?.id as string;
  const report = useQuery(api.reports.getFull, { id: id as any });
  const items = useQuery(api.reports.itemsByReport as any, { reportId: id as any } as any);

  const byMarket = useMemo(() => {
    if (!items) return undefined;
    const map = new Map<string, any[]>();
    for (const it of items) {
      const key = `${it.marketId}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  if (!report) {
    return <div className="text-sm text-muted-foreground">Đang tải chi tiết...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Báo cáo: {report.fromDay} - {report.toDay}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>Generated at: {new Date(report.generatedAt).toLocaleString()}</div>
          <div>Included surveys: {report.includedSurveyIds?.length ?? 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tổng hợp theo chợ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Chợ</th>
                  <th className="py-2 pr-4">Nhân viên</th>
                  <th className="py-2 pr-4">Số bảng</th>
                  <th className="py-2 pr-4">Bảng đầy đủ</th>
                </tr>
              </thead>
              <tbody>
                {report.summaryRows?.map((r: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.marketName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{(r.memberNames || []).join(", ")}</td>
                    <td className="py-2 pr-4">{r.surveyCount}</td>
                    <td className="py-2 pr-4">{r.filledCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết snapshot theo chợ</CardTitle>
        </CardHeader>
        <CardContent>
          {!byMarket && <div className="text-sm text-muted-foreground">Đang tải chi tiết...</div>}
          {byMarket && byMarket.length === 0 && (
            <div className="text-sm text-muted-foreground">Không có dữ liệu</div>
          )}
          {byMarket?.map(([marketId, group]: any) => (
            <div key={marketId} className="mb-6">
              <div className="mb-2 font-medium">
                {group[0]?.marketName}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Sản phẩm</th>
                      <th className="py-2 pr-4">Đơn vị</th>
                      <th className="py-2 pr-4">Giá</th>
                      <th className="py-2 pr-4">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((it: any) => (
                      <tr key={String(it.productId) + String(it.surveyId)} className="border-b last:border-0">
                        <td className="py-2 pr-4">{it.productName}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{it.unitAbbr || it.unitName || ""}</td>
                        <td className="py-2 pr-4">{it.price ?? "-"}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{it.note ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
