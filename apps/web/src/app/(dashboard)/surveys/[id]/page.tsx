"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = use(params);
  const id = p?.id as string;
  const detail = useQuery(api.surveys.getFull, { id: id as any });
  const autosave = useMutation(api.surveyItems.autosave);
  const clearPrice = useMutation(api.surveyItems.clearPrice);
  const bulkClear = useMutation(api.surveyItems.bulkClear);

  // local editable list
  const [localItems, setLocalItems] = useState<any[] | undefined>(undefined);

  // Helpers: parse/format tiền Việt (hiển thị 1.000.000 VND)
  const formatVnd = (n: number | null | undefined) =>
    n === null || n === undefined ? "" : Number(n).toLocaleString("vi-VN");
  const onlyDigits = (s: string) => s.replace(/[^0-9]/g, "");
  const parsePriceStr = (s: string): number | null => {
    const digits = onlyDigits(s);
    if (!digits) return null;
    const val = Number(digits);
    return isNaN(val) ? null : val;
  };
  const formatInputLive = (s: string) => {
    const digits = onlyDigits(s);
    if (!digits) return "";
    return Number(digits).toLocaleString("vi-VN");
  };
  useEffect(() => {
    if (detail?.items)
      setLocalItems(
        detail.items.map((it: any) => ({
          ...it,
          priceStr: formatVnd(it.price),
        }))
      );
  }, [detail?.items]);

  if (!detail) return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  const { survey, market, member } = detail as any;
  const items = localItems;

  const onPriceChange = (idx: number, v: string) => {
    if (!items) return;
    const next = [...items];
    const val = parsePriceStr(v);
    const formatted = formatInputLive(v);
    next[idx] = { ...next[idx], price: val, priceStr: formatted };
    setLocalItems(next);
  };

  const onNoteChange = (idx: number, v: string) => {
    if (!items) return;
    const next = [...items];
    next[idx] = { ...next[idx], note: v };
    setLocalItems(next);
  };

  const onBlurSave = async (row: any, idx?: number) => {
    try {
      await autosave({ id: row._id as any, price: row.price as any, note: row.note ?? undefined });
      // sau khi lưu, chuẩn hóa lại hiển thị theo định dạng
      if (idx !== undefined && items) {
        const next = [...items];
        next[idx] = { ...next[idx], priceStr: formatVnd(next[idx].price) };
        setLocalItems(next);
      }
    } catch (e: any) {
      // no toast for now to keep page quiet
      console.error(e);
    }
  };

  const onClearRow = async (row: any, idx: number) => {
    try {
      await clearPrice({ id: row._id as any });
      if (!items) return;
      const next = [...items];
      next[idx] = { ...next[idx], price: null, priceStr: "" };
      setLocalItems(next);
    } catch (e) {}
  };

  const onBulkClear = async () => {
    try {
      await bulkClear({ surveyId: survey._id as any });
      if (items) setLocalItems(items.map((it) => ({ ...it, price: null, priceStr: "" })));
    } catch (e) {}
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Đợt lấy giá: {survey.surveyDay} – {market?.name} – {member?.name}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={onBulkClear}>Xóa mọi giá</Button>
          </div>
          {/* Desktop/tablet view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Sản phẩm</th>
                  <th className="py-2 pr-4">Đơn vị</th>
                  <th className="py-2 pr-4">Giá (VND)</th>
                  <th className="py-2 pr-4">Ghi chú</th>
                  <th className="py-2 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((it: any, idx: number) => (
                  <tr key={String(it._id)} className="border-b last:border-0">
                    <td className="py-2 pr-4">{it.productName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{it.unit?.abbr || it.unit?.name || ""}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={it.priceStr ?? ""}
                          onChange={(e) => onPriceChange(idx, e.target.value)}
                          onBlur={() => onBlurSave(items[idx], idx)}
                          placeholder="1.000.000"
                          className="w-36 text-right"
                        />
                        <span className="text-xs text-muted-foreground">VND</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <Input
                        value={it.note ?? ""}
                        onChange={(e) => onNoteChange(idx, e.target.value)}
                        onBlur={() => onBlurSave(items[idx])}
                        placeholder="Ghi chú"
                      />
                    </td>
                    <td className="py-2 pr-0 text-right">
                      <Button size="sm" variant="outline" onClick={() => onClearRow(it, idx)}>Xóa giá dòng</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile-friendly stacked cards */}
          <div className="sm:hidden grid gap-3">
            {items?.map((it: any, idx: number) => (
              <div key={String(it._id)} className="rounded-md border p-3">
                <div className="mb-2">
                  <div className="font-medium leading-tight">{it.productName}</div>
                  <div className="text-xs text-muted-foreground">{it.unit?.abbr || it.unit?.name || ""}</div>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs text-muted-foreground">Giá (VND)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={it.priceStr ?? ""}
                      onChange={(e) => onPriceChange(idx, e.target.value)}
                      onBlur={() => onBlurSave(items[idx], idx)}
                      placeholder="1.000.000"
                      className="flex-1 text-right h-11 text-base"
                    />
                    <span className="text-xs text-muted-foreground">VND</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  <label className="text-xs text-muted-foreground">Ghi chú</label>
                  <textarea
                    value={it.note ?? ""}
                    onChange={(e) => onNoteChange(idx, e.target.value)}
                    onBlur={() => onBlurSave(items[idx])}
                    placeholder="Nhập ghi chú (tuỳ chọn)"
                    rows={2}
                    className="h-auto min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => onClearRow(it, idx)}>Xóa giá dòng</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
