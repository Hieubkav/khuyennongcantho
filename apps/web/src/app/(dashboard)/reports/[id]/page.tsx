"use client";

import { use, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = use(params);
  const id = p?.id as string;
  const report = useQuery(api.reports.getFull, { id: id as any });
  const search = useSearchParams();
  const marketIdParam = search?.get("marketId");
  const items = useQuery(api.reports.itemsByReport as any, {
    reportId: id as any,
    marketId: marketIdParam ? (marketIdParam as any) : undefined,
  } as any);

  // Group and aggregate average price per product for each market
  const aggregates = useMemo(() => {
    if (!items) return undefined as undefined | Array<{ marketId: string; marketName: string; rows: any[] }>;
    const byMarket = new Map<string, any[]>();
    for (const it of items as any[]) {
      const key = String(it.marketId);
      if (!byMarket.has(key)) byMarket.set(key, []);
      byMarket.get(key)!.push(it);
    }
    const result: Array<{ marketId: string; marketName: string; rows: any[] }> = [];
    for (const [mid, group] of Array.from(byMarket.entries())) {
      const byProduct = new Map<string, { productName: string; unit: string; prices: number[] }>();
      for (const it of group) {
        const key = String(it.productId);
        const unit = it.unitAbbr || it.unitName || "";
        if (!byProduct.has(key)) byProduct.set(key, { productName: it.productName, unit, prices: [] });
        if (it.price !== null && it.price !== undefined) byProduct.get(key)!.prices.push(it.price as number);
      }
      const rows = Array.from(byProduct.values()).map((p) => ({
        productName: p.productName,
        unit: p.unit,
        avg: p.prices.length > 0 ? (p.prices.reduce((a, b) => a + b, 0) / p.prices.length) : null,
      }));
      result.push({ marketId: mid, marketName: (group[0] as any)?.marketName ?? "", rows });
    }
    return result;
  }, [items]);

  const nf = new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const formatDateTimeVN = (ms: number) => {
    try {
      return new Date(ms).toLocaleString("vi-VN", {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (!report) {
    return <div className="text-sm text-muted-foreground">Dang tai chi tiet...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Bao cao: {report.fromDay} - {report.toDay}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>Sinh luc: {formatDateTimeVN(report.generatedAt)}</div>
          <div>So bang: {report.includedSurveyIds?.length ?? 0}</div>
          <div>
            Trang thai: {" "}
            <span className={report.active ? "text-green-600" : "text-gray-500"}>
              {report.active ? "Dang dung" : "Tam tat"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tong hop theo cho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Cho</th>
                  <th className="py-2 pr-4">Nhan vien</th>
                  <th className="py-2 pr-4">So bang</th>
                  <th className="py-2 pr-4">Bang day du</th>
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
          <CardTitle>BAO CAO TONG HOP trung binh gia</CardTitle>
        </CardHeader>
        <CardContent>
          {!aggregates && <div className="text-sm text-muted-foreground">Dang tai chi tiet...</div>}
          {aggregates && aggregates.length === 0 && (
            <div className="text-sm text-muted-foreground">Khong co du lieu</div>
          )}
          {aggregates?.map((group) => (
            <div key={group.marketId} className="mb-6">
              <div className="mb-2 font-medium">
                {group.marketName}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">San pham</th>
                      <th className="py-2 pr-4">Don vi</th>
                      <th className="py-2 pr-4">Gia trung binh (VND)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row: any) => (
                      <tr key={row.productName} className="border-b last:border-0">
                        <td className="py-2 pr-4">{row.productName}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.unit}</td>
                        <td className="py-2 pr-4">{row.avg !== null ? `${nf.format(row.avg)} VND` : "-"}</td>
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
