"use client";

import { use, useMemo, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchParams } from "next/navigation";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = use(params);
  const id = p?.id as string;
  const report = useQuery(api.reports.getFull, { id: id as any });
  const search = useSearchParams();
  const marketIdParam = search?.get("marketId");
  const surveyIdParam = search?.get("surveyId");
  const items = useQuery(api.reports.itemsByReport as any, {
    reportId: id as any,
    marketId: marketIdParam ? (marketIdParam as any) : undefined,
    surveyId: surveyIdParam ? (surveyIdParam as any) : undefined,
  } as any);

  // Build market list from items for toggling
  const marketList = useMemo(() => {
    if (!items) return undefined as undefined | Array<{ id: string; name: string }>;
    const seen = new Map<string, string>();
    for (const it of (items as any[])) {
      const mid = String((it as any).marketId);
      if (!seen.has(mid)) seen.set(mid, (it as any).marketName ?? "");
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const [marketToggle, setMarketToggle] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!marketList) return;
    const next: Record<string, boolean> = {};
    for (const m of marketList) next[m.id] = true;
    setMarketToggle(next);
  }, [marketList?.length]);

  const selectedMarketIds = useMemo(
    () => Object.entries(marketToggle).filter(([, v]) => !!v).map(([k]) => k),
    [marketToggle]
  );

  // Combined average across selected markets
  const combined = useMemo(() => {
    if (!items) return undefined as undefined | Array<{ productName: string; unit: string; avg: number | null }>;
    const allow = new Set(
      selectedMarketIds.length > 0 ? selectedMarketIds : (marketList || []).map((m) => m.id)
    );
    const byProduct = new Map<string, { productName: string; unit: string; prices: number[] }>();
    for (const it of items as any[]) {
      const mid = String((it as any).marketId);
      if (!allow.has(mid)) continue;
      const key = String((it as any).productId);
      const unit = (it as any).unitAbbr || (it as any).unitName || "";
      if (!byProduct.has(key)) byProduct.set(key, { productName: (it as any).productName, unit, prices: [] });
      const price = (it as any).price;
      if (price !== null && price !== undefined) byProduct.get(key)!.prices.push(price as number);
    }
    return Array.from(byProduct.values()).map((p) => ({
      productName: p.productName,
      unit: p.unit,
      avg: p.prices.length > 0 ? p.prices.reduce((a, b) => a + b, 0) / p.prices.length : null,
    }));
  }, [items, marketList, selectedMarketIds]);

  // Helper: average per market id
  const avgForMarket = useMemo(() => {
    if (!items) return (mid: string) => [] as Array<{ productName: string; unit: string; avg: number | null }>;
    const byMarket = new Map<string, Map<string, { productName: string; unit: string; prices: number[] }>>();
    for (const it of (items as any[])) {
      const mid = String((it as any).marketId);
      const key = String((it as any).productId);
      const unit = (it as any).unitAbbr || (it as any).unitName || "";
      if (!byMarket.has(mid)) byMarket.set(mid, new Map());
      const map = byMarket.get(mid)!;
      if (!map.has(key)) map.set(key, { productName: (it as any).productName, unit, prices: [] });
      const price = (it as any).price;
      if (price !== null && price !== undefined) map.get(key)!.prices.push(price as number);
    }
    return (mid: string) => {
      const map = byMarket.get(String(mid));
      if (!map) return [];
      return Array.from(map.values()).map((p) => ({
        productName: p.productName,
        unit: p.unit,
        avg: p.prices.length > 0 ? p.prices.reduce((a, b) => a + b, 0) / p.prices.length : null,
      }));
    };
  }, [items]);

  const onExportXlsx = async () => {
    if (!items) return;
    const selected = selectedMarketIds.length > 0 ? selectedMarketIds : (marketList || []).map((m) => m.id);
    if (selected.length === 0) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    if (selected.length === 1) {
      const mid = selected[0];
      const mname = (marketList || []).find((m) => m.id === mid)?.name || mid;
      const rows = avgForMarket(mid);
      const aoa: any[][] = [["San pham", "Don vi", "Gia trung binh"]];
      for (const r of rows) aoa.push([r.productName, r.unit, r.avg === null ? null : Number(r.avg.toFixed(2))]);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 18 }];
      // number format for column C
      const range = XLSX.utils.decode_range(ws["!ref"] as string);
      for (let R = 1; R <= range.e.r; R++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })];
        if (cell && cell.t === "n") cell.z = "#,##0.00";
      }
      XLSX.utils.book_append_sheet(wb, ws, mname.substring(0, 31));
    } else {
      const rows = combined || [];
      const aoa: any[][] = [["San pham", "Don vi", "Gia trung binh"]];
      for (const r of rows) aoa.push([r.productName, r.unit, r.avg === null ? null : Number(r.avg.toFixed(2))]);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 18 }];
      const range = XLSX.utils.decode_range(ws["!ref"] as string);
      for (let R = 1; R <= range.e.r; R++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })];
        if (cell && cell.t === "n") cell.z = "#,##0.00";
      }
      XLSX.utils.book_append_sheet(wb, ws, "Tong hop");
    }

    const fname = `BaoCao_${report?.fromDay ?? ""}_${report?.toDay ?? ""}.xlsx`;
    XLSX.writeFile(wb, fname);
  };

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
    return <div className="text-sm text-muted-foreground">Đang tải chi tiết...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tổng hợp trung bình toàn bộ */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <CardTitle>Tổng hợp trung bình (toàn bộ)</CardTitle>
          <Button size="sm" onClick={onExportXlsx} disabled={(selectedMarketIds.length ?? 0) === 0}>
            Xuất Excel
          </Button>
        </CardHeader>
        <CardContent>
          {marketList && marketList.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const next: Record<string, boolean> = {};
                  marketList.forEach((m) => (next[m.id] = true));
                  setMarketToggle(next);
                }}
              >
                Chọn tất cả
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const next: Record<string, boolean> = {};
                  marketList.forEach((m) => (next[m.id] = false));
                  setMarketToggle(next);
                }}
              >
                Bỏ chọn
              </Button>
              {marketList.map((m) => (
                <label key={m.id} className="inline-flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!marketToggle[m.id]}
                    onCheckedChange={(v: any) => setMarketToggle((s) => ({ ...s, [m.id]: !!v }))}
                  />
                  <span>{m.name || m.id}</span>
                </label>
              ))}
              {selectedMarketIds.length === 0 && (
                <span className="text-sm text-muted-foreground">Hãy chọn ít nhất một chợ để xem và xuất Excel</span>
              )}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Sản phẩm</th>
                  <th className="py-2 pr-4">Đơn vị</th>
                  <th className="py-2 pr-4">Giá trung bình (VND)</th>
                </tr>
              </thead>
              <tbody>
                {combined?.map((row) => (
                  <tr key={row.productName} className="border-b last:border-0">
                    <td className="py-2 pr-4">{row.productName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{row.unit}</td>
                    <td className="py-2 pr-4">{row.avg !== null ? `${nf.format(row.avg)} VND` : "-"}</td>
                  </tr>
                ))}
                {!combined && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">
                      Đang tải chi tiết...
                    </td>
                  </tr>
                )}
                {combined && combined.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="hidden">
        <CardHeader>
          <CardTitle>
            Báo cáo: {report.fromDay} - {report.toDay}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>Sinh lúc: {formatDateTimeVN(report.generatedAt)}</div>
          <div>Số bảng: {report.includedSurveyIds?.length ?? 0}</div>
          <div>
            Trạng thái:{" "}
            <span className={report.active ? "text-green-600" : "text-gray-500"}>
              {report.active ? "Đang dùng" : "Tạm tắt"}
            </span>
          </div>
          {(marketIdParam || surveyIdParam) && (
            <div>
              Bo loc: {marketIdParam ? `Theo cho (${marketIdParam})` : ""}
              {marketIdParam && surveyIdParam ? ", " : ""}
              {surveyIdParam ? `Theo dot (${surveyIdParam})` : ""}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="hidden">
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

      <Card className="hidden">
        <CardHeader>
          <CardTitle>BÁO CÁO TỔNG HỢP trung bình giá</CardTitle>
        </CardHeader>
        <CardContent>
          {!aggregates && <div className="text-sm text-muted-foreground">Đang tải chi tiết...</div>}
          {aggregates && aggregates.length === 0 && (
            <div className="text-sm text-muted-foreground">Không có dữ liệu</div>
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
                      <th className="py-2 pr-4">Sản phẩm</th>
                      <th className="py-2 pr-4">Đơn vị</th>
                      <th className="py-2 pr-4">Giá trung bình (VND)</th>
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
