'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const apiAny = api as any;

type NoteType = 'up' | 'down' | 'other' | undefined;

export default function EditRoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const profileId = (session?.user as any)?.id as string | undefined;
  const role = ((session?.user as any)?.role ?? 'member') as 'admin' | 'member';

  const round = useQuery(apiAny.priceRounds.getWithPrices, { id: id as any });
  const marketsAll = useQuery(api.markets.list, { limit: 500 });
  const products = useQuery(api.products.list, { limit: 500 });
  const units = useQuery(apiAny.units.list, { active: true, limit: 500 });
  const status = useQuery(apiAny.priceRounds.status, round ? { roundId: (round as any)?._id } : 'skip');

  const close = useMutation(apiAny.priceRounds.close);
  const submit = useMutation(apiAny.priceRounds.submitV2);
  const removeRound = useMutation(apiAny.priceRoundsAdmin?.remove);
  const updateForDate = useMutation(apiAny.priceRoundsAdmin?.updateForDate);
  const reopen = useMutation(apiAny.priceRoundsAdmin?.reopen);

  const [values, setValues] = useState<Record<string, { price: string; noteType: NoteType; notes: string }>>({});
  useEffect(() => {
    if (!round) return;
    const next: Record<string, { price: string; noteType: NoteType; notes: string }> = {};
    for (const it of (round as any).items) {
      const pid = String((it.productId as any).id ?? it.productId);
      const p = it.price;
      next[pid] = {
        price: p ? String(p.price) : '',
        noteType: p?.noteType as NoteType,
        notes: p?.notes ?? ''
      };
    }
    setValues(next);
  }, [round]);

  const productMap = useMemo(() => {
    const m = new Map<string, any>();
    if (products) for (const p of products.products) m.set(String(p._id), p);
    return m;
  }, [products]);
  const unitMap = useMemo(() => {
    const m = new Map<string, any>();
    if (units) for (const u of units.units) m.set(String(u._id), u);
    return m;
  }, [units]);

  // Tính 'hôm nay' theo giờ Việt Nam để khớp backend (đặt trước early return để cố định thứ tự hooks)
  const vnToday = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), []);
  const isToday = (round as any)?.forDate === vnToday;

  // Save all filled rows at once (declare before any early return to keep hooks order stable)
  const [savingAll, setSavingAll] = useState(false);
  const handleSaveAll = async () => {
    if (!round || !profileId) return;
    try {
      setSavingAll(true);
      const tasks = Object.entries(values)
        .filter(([_, v]) => !!(v as any)?.price)
        .map(([pid, v]: any) =>
          submit({
            roundId: (round as any)._id,
            productId: pid as any,
            editorId: profileId as any,
            price: parseFloat(v.price),
            noteType: (v.noteType as any) || undefined,
            notes: v.notes || undefined,
          })
        );
      await Promise.all(tasks);
      toast.success('Da luu tat ca muc co gia');
    } catch (e: any) {
      toast.error(e.message || 'Luu tat ca that bai');
    } finally {
      setSavingAll(false);
    }
  };

  // Derive manager snapshot & market name before any early return to keep hook order stable
  const managerLocked = useMemo(() => {
    const r: any = round;
    const mgr = r?.managerId;
    if (!mgr) return undefined;
    return String(((mgr as any)?.id ?? mgr));
  }, [round]);
  const managerProfiles = useQuery(
    apiAny.profiles.getManyPublic,
    managerLocked ? { ids: [managerLocked] as any } : 'skip'
  ) as any[] | 'skip' | undefined;
  const managerLabel = useMemo(() => {
    if (!managerLocked) return undefined;
    const p = Array.isArray(managerProfiles) ? managerProfiles[0] : undefined;
    return p?.name || p?.email || managerLocked;
  }, [managerLocked, managerProfiles]);
  const marketName = useMemo(() => {
    const r: any = round;
    const idStr = String((r?.marketId as any)?.id ?? r?.marketId ?? '');
    const m = marketsAll?.markets?.find((x: any) => String(x._id) === idStr);
    return m?.name ?? idStr;
  }, [marketsAll, round]);

  if (!round || !products || !units) return <div>Đang tải...</div>;

  const handleCloseRound = async () => {
    if (!round) return;
    try {
      await close({ roundId: (round as any)._id });
      toast.success('Đã đóng đợt');
    } catch (e: any) {
      toast.error(e.message || 'Đóng đợt thất bại');
    }
  };

  const handleChange = (pid: string, field: 'price' | 'noteType' | 'notes', value: string) => {
    setValues((prev) => ({ ...prev, [pid]: { ...(prev[pid] ?? { price: '', noteType: undefined, notes: '' }), [field]: value } }));
  };

  const handleSubmit = async (pid: string) => {
    if (!round || !profileId) return;
    if (!isToday) {
      toast.info('Chỉ nhập trong đúng ngày của đợt (giờ VN).');
      return;
    }
    const v = values[pid];
    if (!v || !v.price) return;
    try {
      await submit({
        roundId: (round as any)._id,
        productId: pid as any,
        editorId: profileId as any,
        price: parseFloat(v.price),
        noteType: (v.noteType as any) || undefined,
        notes: v.notes || undefined,
      });
      toast.success('Đã lưu');
    } catch (e: any) {
      toast.error(e.message || 'Lưu thất bại');
    }
  };
  /* duplicate timezone block removed
  // Đồng bộ timezone với backend (Asia/Ho_Chi_Minh)



  */

  

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="items-start sm:items-center justify-between">
          <div className="w-full flex items-start sm:items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className="text-base font-semibold truncate">Đợt lấy giá - {marketName}</div>
              <div className="text-xs text-muted-foreground">Ngày {(round as any).forDate}</div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              {managerLocked && <span className="truncate max-w-[12rem] sm:max-w-none">Khóa người nhập: {managerLabel}</span>}
            </div>
          </div>
          <div className="mt-2 sm:mt-0">
            {(round as any).status === 'open' && (
              <Button variant="outline" onClick={handleCloseRound}>Đóng đợt</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile: card list */}
          <div className="md:hidden grid gap-3">
            {(round as any).items.map((it: any) => {
              const pid = String((it.productId as any).id ?? it.productId);
              const uid = String((it.unitId as any).id ?? it.unitId);
              const v = values[pid] ?? { price: '', noteType: undefined, notes: '' };
              const unit = unitMap.get(uid)?.name ?? uid;
              return (
                <div key={pid} className="rounded border p-3 bg-white space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <span className="truncate">{productMap.get(pid)?.name ?? pid}</span>
                    {v.noteType && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${v.noteType === 'up' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : v.noteType === 'down' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>{v.noteType}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Đơn vị: {unit}</div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={0} step={100} className="flex-1 min-w-0" value={v.price} onChange={(e) => handleChange(pid, 'price', e.target.value)} />
                    <Select value={(v.noteType as string) || 'none'} onValueChange={(val) => handleChange(pid, 'noteType', val === 'none' ? (undefined as any) : (val as any))}>
                      <SelectTrigger className="w-[120px] sm:w-32">
                        <SelectValue placeholder="Ghi chú" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không</SelectItem>
                        <SelectItem value="up">Tăng</SelectItem>
                        <SelectItem value="down">Giảm</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input value={v.notes} onChange={(e) => handleChange(pid, 'notes', e.target.value)} placeholder="Ghi chú" />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleSubmit(pid)} disabled={!isToday}>{isToday ? 'Lưu' : 'Chờ tới ngày'}</Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium">Sản phẩm</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Đơn vị</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Giá</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Ghi chú</th>
                  <th className="px-4 py-2 text-right text-xs font-medium">Lưu</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(round as any).items.map((it: any) => {
                  const pid = String((it.productId as any).id ?? it.productId);
                  const uid = String((it.unitId as any).id ?? it.unitId);
                  const v = values[pid] ?? { price: '', noteType: undefined, notes: '' };
                  const unit = unitMap.get(uid)?.name ?? uid;
                  return (
                    <tr key={pid}>
                      <td className="px-4 py-2 whitespace-nowrap">{productMap.get(pid)?.name ?? pid}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{unit}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Input type="number" min={0} step={100} className="w-40" value={v.price} onChange={(e) => handleChange(pid, 'price', e.target.value)} />
                          <Select value={(v.noteType as string) || 'none'} onValueChange={(val) => handleChange(pid, 'noteType', val === 'none' ? (undefined as any) : (val as any))}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Ghi chú" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Không</SelectItem>
                              <SelectItem value="up">Tăng</SelectItem>
                              <SelectItem value="down">Giảm</SelectItem>
                              <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Input value={v.notes} onChange={(e) => handleChange(pid, 'notes', e.target.value)} placeholder="Ghi chú" />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" onClick={() => handleSubmit(pid)} disabled={!isToday}>
                          {isToday ? 'Lưu' : 'Chờ tới ngày nhập'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!isToday && (
              <div className="text-sm text-muted-foreground mt-2">Đợt này chưa đến ngày nhập. Chỉ xem, không nhập trước.</div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 z-40">
        <div className="mx-auto max-w-4xl sm:max-w-6xl lg:max-w-7xl px-3 sm:px-4 pb-2">
          <div className="mb-3 bg-white/90 backdrop-blur border rounded-lg shadow-sm px-3 py-2 flex items-center justify-between gap-2">
            <div className="text-xs sm:text-sm">
              Tiến độ: {Math.round(((status as any)?.completion ?? 0) * 100)}% ({(status as any)?.filledCount ?? 0}/{(status as any)?.productCount ?? 0})
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveAll} disabled={!isToday || savingAll}>
                {savingAll ? 'Đang lưu...' : (isToday ? 'Lưu tất cả' : 'Chờ tới ngày nhập')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




