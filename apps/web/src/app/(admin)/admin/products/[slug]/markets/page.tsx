'use client';

import { use, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const apiAny = api as any;

export default function ProductMarketsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = useQuery(api.products.bySlug, { slug });
  const markets = useQuery(api.markets.list, { limit: 500 });
  const assigned = useQuery(apiAny.marketProducts.listByProduct, product ? { productId: product._id, active: undefined } : 'skip');
  const add = useMutation(apiAny.marketProducts.add);
  const remove = useMutation(apiAny.marketProducts.remove);

  const assignedSet = useMemo(
    () => new Set((assigned ?? []).filter((x: any) => x.active).map((x: any) => String(x.marketId))),
    [assigned]
  );

  if (!product || !markets || !assigned) return <div>Đang tải...</div>;

  const toggle = async (marketId: any) => {
    try {
      if (assignedSet.has(String(marketId))) {
        await remove({ marketId, productId: product._id } as any);
        toast.success('Đã gỡ khỏi chợ');
      } else {
        await add({ marketId, productId: product._id, unitId: product.defaultUnitId } as any);
        toast.success('Đã gán vào chợ');
      }
    } catch (e: any) {
      toast.error(e.message || 'Thao tác thất bại');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chợ liên quan – {product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {markets.markets.map((m: any) => {
            const on = assignedSet.has(String(m._id));
            return (
              <div key={String(m._id)} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.slug}</div>
                </div>
                <Button size="sm" variant={on ? 'outline' : 'default'} onClick={() => toggle(m._id)}>
                  {on ? 'Bỏ' : 'Gán'}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

