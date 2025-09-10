'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const apiAny = api as any;

export default function CreateRoundPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role ?? 'member') as 'admin' | 'member';
  const profileId = (session?.user as any)?.id as string | undefined;

  const marketsAll = useQuery(api.markets.list, { limit: 500 });
  const myMemberships = useQuery(apiAny.marketMembers.listByProfile, profileId ? { profileId: profileId as any, active: true } : 'skip');

  const [marketId, setMarketId] = useState<string>('');
  const [forDate, setForDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const markets = useMemo(() => {
    if (!marketsAll) return [] as any[];
    if (role === 'admin' || !myMemberships) return marketsAll.markets;
    const allowed = new Set(myMemberships.map((m: any) => String(m.marketId)));
    return marketsAll.markets.filter((m: any) => allowed.has(String(m._id)));
  }, [marketsAll, myMemberships, role]);

  useEffect(() => {
    if (!marketId && markets && markets.length > 0) setMarketId(String(markets[0]._id));
  }, [markets, marketId]);

  const managers = useQuery(apiAny.marketMembers.listByMarket, marketId ? { marketId: marketId as any, active: true } : 'skip');
  const marketProducts = useQuery(apiAny.marketProducts.listByMarket, marketId ? { marketId: marketId as any, active: true } : 'skip');
  const products = useQuery(api.products.list, { limit: 500 });
  const units = useQuery(apiAny.units.list, { active: true, limit: 500 });

  const create = useMutation(apiAny.priceRounds.create);

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

  // Build profile map for managers
  const managerIds = useMemo(() => {
    if (!Array.isArray(managers)) return [] as string[];
    return managers.map((m: any) => String(((m.profileId as any).id ?? m.profileId)));
  }, [managers]);
  const managerProfiles = useQuery(
    apiAny.profiles.getManyPublic,
    managerIds.length ? { ids: managerIds as any } : 'skip'
  ) as any[] | 'skip' | undefined;
  const managerProfileMap = useMemo(() => {
    const m = new Map<string, any>();
    if (Array.isArray(managerProfiles)) {
      for (const p of managerProfiles) m.set(String(p._id), p);
    }
    return m;
  }, [managerProfiles]);

  if (!marketsAll || (role !== 'admin' && !myMemberships)) return <div>Đang tải...</div>;

  const managersReady = Array.isArray(managers);
  const productsReady = Array.isArray(marketProducts);
  const sessionReady = status === 'authenticated';
  const canCreate = !!marketId && !!forDate && sessionReady && managersReady && productsReady && (managers as any[])?.length > 0 && (marketProducts as any[])?.length > 0;

  const handleCreate = async () => {
    if (!profileId) return toast.error('Bạn chưa đăng nhập hoặc phiên chưa sẵn sàng');
    if (!marketId) return toast.error('Vui lòng chọn chợ');
    if (!forDate) return toast.error('Vui lòng chọn ngày');
    if (Array.isArray(managers) && managers.length === 0) return toast.error('Chợ này chưa có thành viên quản lý');
    if (Array.isArray(marketProducts) && marketProducts.length === 0) return toast.error('Chợ này chưa có danh sách sản phẩm');
    try {
      const id = await create({ marketId: marketId as any, creatorId: profileId as any, forDate });
      toast.success('Đã tạo đợt lấy giá');
      router.push(`/admin/rounds/${id}/edit`);
    } catch (e: any) {
      toast.error(e.message || 'Tạo đợt thất bại');
    }
  };

  const currentMarket = markets.find((m: any) => String(m._id) === marketId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tạo đợt lấy giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Chợ</Label>
              <Select value={marketId} onValueChange={setMarketId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chợ" />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((m: any) => (
                    <SelectItem key={String(m._id)} value={String(m._id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ngày</Label>
              <Input type="date" value={forDate} onChange={(e) => setForDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleCreate} disabled={!canCreate}>Tạo đợt</Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">Khi tạo sẽ khóa: chợ, người phụ trách hiện tại và danh sách sản phẩm tại thời điểm này.</div>
          {!canCreate && (
            <div className="text-xs text-amber-600 mt-2">
              {(!sessionReady) && <div>- Chưa sẵn sàng phiên đăng nhập</div>}
              {(!marketId) && <div>- Chưa chọn chợ</div>}
              {(!forDate) && <div>- Chưa chọn ngày</div>}
              {(managersReady && (managers as any[])?.length === 0) && <div>- Chợ này chưa có thành viên quản lý</div>}
              {(productsReady && (marketProducts as any[])?.length === 0) && <div>- Chợ này chưa có danh sách sản phẩm</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {marketId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Người phụ trách hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(managers) ? (
                <div>Đang tải...</div>
              ) : managers.length === 0 ? (
                <div className="text-sm text-red-600">Chợ này chưa có thành viên quản lý.</div>
              ) : (
                <ul className="list-disc pl-5">
                  {managers.map((m: any) => (
                    <li key={String(m._id)}>
                      {(() => {
                        const pid = String(((m.profileId as any).id ?? m.profileId));
                        const p = managerProfileMap.get(pid);
                        const label = p?.name || p?.email || pid;
                        return <span className="font-medium">{label}</span>;
                      })()}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm áp dụng</CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(marketProducts) ? (
                <div>Đang tải...</div>
              ) : marketProducts.length === 0 ? (
                <div className="text-sm">Chưa cấu hình danh sách sản phẩm cho chợ này.</div>
              ) : (
                <div className="max-h-80 overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium">Sản phẩm</th>
                        <th className="px-4 py-2 text-left text-xs font-medium">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {marketProducts.map((it: any) => {
                        const pid = String((it.productId as any).id ?? it.productId);
                        const uid = String((it.unitId as any).id ?? it.unitId);
                        return (
                          <tr key={String(it._id)}>
                            <td className="px-4 py-2">{productMap.get(pid)?.name ?? pid}</td>
                            <td className="px-4 py-2">{unitMap.get(uid)?.name ?? uid}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
