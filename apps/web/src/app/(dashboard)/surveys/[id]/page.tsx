"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addressLabel } from "@/lib/vn-locations";
import { Progress } from "@/components/ui/progress";
import { useParams } from "next/navigation";

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useQuery(api.surveys.getFull, { id: id as any });
  const autosave = useMutation(api.surveyItems.autosave);
  const clearPrice = useMutation(api.surveyItems.clearPrice);
  const bulkClear = useMutation(api.surveyItems.bulkClear);
  const updateSurveyDay = useMutation(api.surveys.updateSurveyDay as any);
  const confirmActive = useMutation(api.surveys.confirmActive as any);
  const toggleActive = useMutation(api.surveys.toggleActive);

  const [localItems, setLocalItems] = useState<any[] | undefined>(undefined);

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
        (detail as any).items.map((it: any) => ({
          ...it,
          priceStr: formatVnd(it.price),
        }))
      );
  }, [detail?.items]);

  const [day, setDay] = useState<string | undefined>(undefined);
  useEffect(() => {
    const sd = (detail as any)?.survey?.surveyDay as string | undefined;
    if (sd) setDay(String(sd));
  }, [detail?.survey?.surveyDay]);

  if (!detail) return <div className="text-sm text-muted-foreground">Đang tải...</div>;
  const { survey, market } = detail as any;
  const items = localItems;

  const filledCount = (items ?? []).filter((it) => it.price !== null && it.price !== undefined).length;
  const totalCount = items?.length ?? 0;
  const progressVal = totalCount ? Math.round((filledCount / totalCount) * 100) : 0;

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
      if (idx !== undefined && items) {
        const next = [...items];
        next[idx] = { ...next[idx], priceStr: formatVnd(next[idx].price) };
        setLocalItems(next);
      }
    } catch (e) {
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
    } catch {}
  };

  const onBulkClear = async () => {
    try {
      await bulkClear({ surveyId: survey._id as any });
      if (items) setLocalItems(items.map((it) => ({ ...it, price: null, priceStr: "" })));
    } catch {}
  };

  const onChangeDay = async (value: string) => {
    setDay(value);
    try {
      await updateSurveyDay({ id: survey._id as any, surveyDay: value });
    } catch (e) {
      console.error(e);
    }
  };

  const onConfirm = async () => {
    try {
      await confirmActive({ id: survey._id as any });
    } catch (e) {
      console.error(e);
    }
  };

  const onToggleActive = async () => {
    try {
      await toggleActive({ id: survey._id as any, active: !survey.active });
    } catch (e) {
      console.error(e);
    }
  };

  const isSpecial = String(id) === "n57bc7ddze17pk0z9g5dc1wd1d7qjv81";
  const statusActiveText = isSpecial ? "Đã gửi" : "Đang dùng";
  const statusInactiveText = isSpecial ? "Chưa gửi" : "Tạm tắt";

  return (
    <div className="space-y-6">
      {/* Mobile compact fixed header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="px-3 py-2 leading-tight">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Giá nông sản</div>
          <div className="mt-0.5 text-sm font-medium truncate">Chợ: {(detail as any)?.market?.name ?? '-'}</div>
          <div className="text-xs text-muted-foreground truncate">
            Địa chỉ: {addressLabel(
              (detail as any)?.market?.addressJson?.provinceCode,
              (detail as any)?.market?.addressJson?.districtCode,
              (detail as any)?.market?.addressJson?.wardCode,
              (detail as any)?.market?.addressJson?.detail
            ) || '-'}
          </div>
          <div className="mt-1 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
            <span className="text-xs text-muted-foreground">Thời điểm:</span>
            <div>
              <Input
                type="date"
                value={(detail as any)?.survey?.surveyDay ?? ''}
                onChange={(e) => onChangeDay(e.target.value)}
                className="h-8 text-sm w-[8.5rem]"
              />
            </div>
            <span className="text-xs text-muted-foreground">Trạng thái:</span>
            <div className="flex items-center gap-2">
            <span className={(detail as any)?.survey?.active ? "text-green-600 font-medium whitespace-nowrap" : "text-gray-500 whitespace-nowrap"}>
                {(detail as any)?.survey?.active ? statusActiveText : statusInactiveText}
            </span>
              <Button size="sm" className="whitespace-nowrap" onClick={onToggleActive}>
                {(detail as any)?.survey?.active
                  ? 'Tạm dừng'
                  : (String(id) === 'n57bc7ddze17pk0z9g5dc1wd1d7qjv81' ? 'Gửi báo cáo' : 'Kích hoạt')}
              </Button>
          </div>
        </div>
      </div>
      </div>
      {/* Spacer for fixed header on mobile */}
      <div className="sm:hidden h-28" />

      {/* Desktop/tablet full header card */}
      <Card className="hidden sm:block">
        <CardHeader>
          <CardTitle className="uppercase tracking-wide">GIÁ NÔNG SẢN MỘT SỐ MẶT HÀNG</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="text-sm">
              <div className="text-muted-foreground">Chợ</div>
              <div className="font-medium">{market?.name ?? "-"}</div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Địa chỉ</div>
              <div className="font-medium">
                {addressLabel(
                  market?.addressJson?.provinceCode,
                  market?.addressJson?.districtCode,
                  market?.addressJson?.wardCode,
                  market?.addressJson?.detail
                ) || "-"}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Thời điểm lấy giá</div>
              <div className="flex items-center gap-2">
                <Input type="date" value={day ?? ""} onChange={(e) => onChangeDay(e.target.value)} className="w-48" />
              </div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Trạng thái khảo sát</div>
              <div className="flex items-center gap-2">
                <span className={survey.active ? "text-green-600 font-medium" : "text-gray-500"}>
                  {survey.active ? statusActiveText : statusInactiveText}
                </span>
                <Button size="sm" onClick={onToggleActive}>
                  {survey.active
                    ? "Tạm dừng"
                    : (String(id) === "n57bc7ddze17pk0z9g5dc1wd1d7qjv81" ? "Gửi báo cáo" : "Kích hoạt")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-2 sm:px-6">
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
                          className="w-36 text-right text-green-600 font-semibold"
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
                      <Button size="sm" variant="outline" onClick={() => onClearRow(it, idx)}>Xóa dòng</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile-friendly stacked cards */}
          <div className="sm:hidden grid gap-2 -mx-2">
            {items?.map((it: any, idx: number) => (
              <div key={String(it._id)} className="rounded-md border p-2">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="font-medium leading-tight">{it.productName}</div>
                  <div className="shrink-0 text-xs text-muted-foreground">{it.unit?.abbr || it.unit?.name || ""}</div>
                </div>
                <div className="grid gap-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={it.priceStr ?? ""}
                    onChange={(e) => onPriceChange(idx, e.target.value)}
                    onBlur={() => onBlurSave(items[idx], idx)}
                    placeholder="1.000.000"
                    className="flex-1 text-right h-16 text-2xl font-semibold text-green-600"
                  />
                </div>
                <div className="mt-2 grid gap-1">
                  <Input
                    type="text"
                    value={it.note ?? ""}
                    onChange={(e) => onNoteChange(idx, e.target.value)}
                    onBlur={() => onBlurSave(items[idx])}
                    placeholder="Ghi chú (tuỳ chọn)"
                    className="h-9"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compact progress widget */}
      <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 z-40">
        <div className="mx-auto max-w-md sm:max-w-xs rounded-md border bg-white/90 backdrop-blur px-3 py-2 shadow-sm">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium">{filledCount}/{totalCount}</span>
          </div>
          <Progress value={progressVal} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}
