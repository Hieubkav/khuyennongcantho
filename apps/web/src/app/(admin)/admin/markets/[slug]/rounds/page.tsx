'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const apiAny = api as any;

type NoteType = 'up' | 'down' | 'other' | undefined;

export default function MarketRoundPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session } = useSession();
  const profileId = (session?.user as any)?.id as string | undefined;

  const market = useQuery(api.markets.bySlug, { slug });
  const [forDate, setForDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const round = useQuery(
    apiAny.priceRounds.getActiveForMarket,
    market ? { marketId: market._id, date: forDate } : 'skip'
  );
  const status = useQuery(apiAny.priceRounds.status, round ? { roundId: (round as any)?._id } : 'skip');
  const managers = useQuery(apiAny.marketMembers.listByMarket, market ? { marketId: market._id, active: true } : 'skip');
  const products = useQuery(api.products.list, { limit: 500 });
  const units = useQuery(apiAny.units.list, { active: true, limit: 500 });

  const create = useMutation(apiAny.priceRounds.create);
  const close = useMutation(apiAny.priceRounds.close);
  const submit = useMutation(apiAny.priceRounds.submit);

  // local state for prices by productId
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

  if (!market || !products || !units) return <div>Đang tải...</div>;

  const handleCreateRound = async () => {
    if (!profileId) return toast.error('Thiếu thông tin người dùng');
    try {
      await create({ marketId: market._id, creatorId: profileId as any, forDate });
      toast.success('Đã tạo đợt lấy giá cho ngày đã chọn');
    } catch (e: any) {
      toast.error(e.message || 'Tạo đợt thất bại');
    }
  };

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

  const today = new Date().toISOString().slice(0, 10);
  const isToday = forDate === today;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Đợt lấy giá – {market.name}</CardTitle>
          <div className="flex gap-2">
            <Input type="date" value={forDate} onChange={(e) => setForDate(e.target.value)} className="w-48" />
            {!round && (
              <Button onClick={handleCreateRound}>Tạo đợt cho ngày đã chọn</Button>
            )}
            {round && (round as any).status === 'open' && (
              <Button variant="outline" onClick={handleCloseRound}>Đóng đợt</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!round ? (
            <div>Chưa có đợt cho ngày đã chọn.</div>
          ) : (
            <div className="overflow-x-auto">
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
                        <td className="px-4 py-2">{productMap.get(pid)?.name ?? pid}</td>
                        <td className="px-4 py-2">{unit}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Input type="number" min={0} step={100} className="w-40" value={v.price} onChange={(e) => handleChange(pid, 'price', e.target.value)} />
                            <Select value={v.noteType || ''} onValueChange={(val) => handleChange(pid, 'noteType', val)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Ghi chú" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Không</SelectItem>
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
                  <div className="text-sm text-muted-foreground mt-2">Đợt này chưa đến ngày nhập. Thành viên chỉ xem, không nhập trước.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Tiến độ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>Tổng mục: {(status as any).productCount}</div>
              <div>Đã nhập: {(status as any).filledCount}</div>
              <div>Hoàn thành: {Math.round(((status as any).completion ?? 0) * 100)}%</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium">Thành viên</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Số mục đã nhập</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(status as any).members.map((m: any) => (
                    <tr key={String(m._id)}>
                      <td className="px-4 py-2">{String(m.profileId)}</td>
                      <td className="px-4 py-2">{m.filled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {market && Array.isArray(managers) && managers.length === 0 && (
        <div className="text-sm text-red-600">Chợ này chưa có thành viên quản lý. Hãy phân quyền trước khi tạo đợt.</div>
      )}
    </div>
  );
}
