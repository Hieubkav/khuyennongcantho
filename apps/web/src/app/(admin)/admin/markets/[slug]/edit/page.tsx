'use client';

import { useEffect, useMemo, useState, use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

const apiAny = api as any;

export default function EditMarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const market = useQuery(api.markets.bySlug, { slug });
  const updateMarket = useMutation(api.markets.update);
  const router = useRouter();

  const members = useQuery(apiAny.marketMembers.listByMarket, market ? { marketId: market._id, active: undefined } : 'skip');
  const allMembers = useQuery(api.profiles.list, { role: 'member' as any, limit: 500 });
  const items = useQuery(apiAny.marketProducts.listByMarket, market ? { marketId: market._id, active: true } : 'skip');
  const products = useQuery(api.products.list, { limit: 500 });
  const units = useQuery(apiAny.units.list, { active: true, limit: 500 });
  const assign = useMutation(apiAny.marketMembers.assign);
  const unassign = useMutation(apiAny.marketMembers.unassign);
  const membersSet = useMemo(() => new Set((members ?? []).filter((m: any) => m.active).map((m: any) => String(m.profileId))), [members]);
  const productName = useMemo(() => {
    const m = new Map<string, string>();
    if (products) for (const p of products.products) m.set(String(p._id), p.name as string);
    return m;
  }, [products]);
  const unitName = useMemo(() => {
    const m = new Map<string, string>();
    if (units) for (const u of units.units) m.set(String(u._id), u.name as string);
    return m;
  }, [units]);
  const [addProductId, setAddProductId] = useState('');
  const [addUnitId, setAddUnitId] = useState('');
  const addMP = useMutation(apiAny.marketProducts.add);
  const removeMP = useMutation(apiAny.marketProducts.remove);
  const handleSelectAddProduct = (id: string) => {
    setAddProductId(id);
    const found = products?.products.find((p: any) => String(p._id) === id);
    if (found) setAddUnitId(String(found.defaultUnitId));
  };
  const handleAddItem = async () => {
    if (!addProductId || !addUnitId) return;
    await addMP({ marketId: (market as any)._id, productId: addProductId as any, unitId: addUnitId as any } as any);
    setAddProductId('');
    setAddUnitId('');
  };

  useEffect(() => {
    if (market) {
      setName(market.name);
      setLocation(market.location || '');
      setActive(market.active);
    }
  }, [market]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name) {
      setError('Tên là bắt buộc');
      return;
    }

    if (!market) {
      setError('Không tìm thấy chợ');
      return;
    }

    try {
      await updateMarket({ id: market._id, name, location, active });
      router.push('/admin/markets');
    } catch (err: any) {
      setError(err.message || 'Cập nhật chợ thất bại');
    }
  };

  if (!market) {
    return <div>Đang tải...</div>;
  }

  return (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Sửa thông tin chợ</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 text-gray-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên chợ</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="location">Địa điểm (tuỳ chọn)</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="active">Kích hoạt</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Lưu thay đổi</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Huỷ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Quản lý & thống kê</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Số thành viên quản lý</div>
            <div className="text-2xl font-semibold">{members ? (members as any[]).filter((m: any) => m.active).length : 0}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Số mặt hàng</div>
            <div className="text-2xl font-semibold">{items ? (items as any[]).filter((x: any) => x.active).length : 0}</div>
          </div>
        </div>

        <div>
          <div className="mb-2 font-medium">Thành viên quản lý</div>
          {!allMembers || !members ? (
            <div>Đang tải...</div>
          ) : (<>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allMembers.map((p: any) => {
                const isAssigned = membersSet.has(String(p._id));
                return (
                  <div key={String(p._id)} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <div className="text-sm font-medium">{p.name ?? p.email}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                    </div>
                    {isAssigned ? (
                      <Button size="sm" variant="outline" onClick={async () => await unassign({ marketId: (market as any)._id, profileId: p._id } as any)}>Gỡ</Button>
                    ) : (
                      <Button size="sm" onClick={async () => await assign({ marketId: (market as any)._id, profileId: p._id } as any)}>Cấp quyền</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
          )}
        </div>

        <div>
          <div className="mb-2 font-medium">Sản phẩm thuộc chợ</div>
          {!items ? (
            <div>Đang tải...</div>
          ) : (<>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Sản phẩm</Label>
                <Select value={addProductId} onValueChange={handleSelectAddProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.products?.map((p: any) => (
                      <SelectItem key={String(p._id)} value={String(p._id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Đơn vị</Label>
                <Select value={addUnitId} onValueChange={setAddUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.units?.map((u: any) => (
                      <SelectItem key={String(u._id)} value={String(u._id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddItem} disabled={!addProductId || !addUnitId}>Thêm</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium">Sản phẩm</th>
                    <th className="px-4 py-2 text-left text-xs font-medium">Đơn vị</th>
                    <th className="px-4 py-2 text-right text-xs font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(items as any[])
                    .filter((it: any) => it.active)
                    .map((it: any) => {
                      const pid = String((it.productId as any).id ?? it.productId);
                      const uid = String((it.unitId as any).id ?? it.unitId);
                      return (
                        <tr key={String(it._id)}>
                          <td className="px-4 py-2">{productName.get(pid) ?? pid}</td>
                          <td className="px-4 py-2">{unitName.get(uid) ?? uid}</td>                          <td className="px-4 py-2 text-right">
                            <Button size="sm" variant="destructive" onClick={async () => await removeMP({ marketId: (market as any)._id, productId: (it.productId as any).id ?? it.productId } as any)}>Bỏ</Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>)}
        </div>
      </CardContent>
    </Card>
  </div>
);
}

