'use client';

import { use, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const apiAny = api as any;

export default function MarketProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const market = useQuery(api.markets.bySlug, { slug });
  const items = useQuery(apiAny.marketProducts.listByMarket, market ? { marketId: market._id } : 'skip');
  const products = useQuery(api.products.list, { limit: 500 });
  const units = useQuery(apiAny.units.list, { active: true, limit: 500 });

  const add = useMutation(apiAny.marketProducts.add);
  const remove = useMutation(apiAny.marketProducts.remove);

  const [productId, setProductId] = useState('');
  const [unitId, setUnitId] = useState('');

  const productName = useMemo(() => {
    const m = new Map<string, any>();
    if (products) for (const p of products.products) m.set(String(p._id), p);
    return m;
  }, [products]);

  const unitName = useMemo(() => {
    const m = new Map<string, any>();
    if (units) for (const u of units.units) m.set(String(u._id), u.name);
    return m;
  }, [units]);

  if (!market || !products || !units || !items) return <div>Đang tải...</div>;

  const handleProductSelect = (id: string) => {
    setProductId(id);
    const p = productName.get(id);
    if (p) setUnitId(String(p.defaultUnitId));
  };

  const handleAdd = async () => {
    if (!productId || !unitId) return;
    try {
      await add({ marketId: market._id, productId: productId as any, unitId: unitId as any });
      toast.success('Đã thêm sản phẩm vào chợ');
      setProductId('');
      setUnitId('');
    } catch (e: any) {
      toast.error(e.message || 'Thêm thất bại');
    }
  };

  const handleRemove = async (pid: any) => {
    try {
      await remove({ marketId: market._id, productId: pid });
      toast.success('Đã bỏ khỏi chợ');
    } catch (e: any) {
      toast.error(e.message || 'Gỡ thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình sản phẩm cho chợ: {market.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Sản phẩm</Label>
              <Select value={productId} onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  {products.products.map((p: any) => (
                    <SelectItem key={String(p._id)} value={String(p._id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Đơn vị</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {units.units.map((u: any) => (
                    <SelectItem key={String(u._id)} value={String(u._id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={!productId || !unitId}>Thêm</Button>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200" />
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
                {items
                  .filter((it: any) => it.active)
                  .map((it: any) => (
                    <tr key={String(it._id)}>
                      <td className="px-4 py-2">{productName.get(String(it.productId))?.name ?? String(it.productId)}</td>
                      <td className="px-4 py-2">{unitName.get(String(it.unitId)) ?? String(it.unitId)}</td>
                      <td className="px-4 py-2 text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleRemove(it.productId)}>Bỏ</Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
