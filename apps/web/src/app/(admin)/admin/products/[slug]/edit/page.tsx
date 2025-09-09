'use client';

import { useEffect, useState, use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const apiAny = api as any;

export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // Unwrap params using use()
  const { slug } = use(params);
  
  const [name, setName] = useState('');
  const [defaultUnitId, setDefaultUnitId] = useState('');
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const product = useQuery(api.products.bySlug, { slug });
  const unitsData = useQuery(apiAny.units.list, { active: true, limit: 200 });
  const units = unitsData?.units ?? [];
  const updateProduct = useMutation(api.products.update);
  const router = useRouter();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDefaultUnitId(product.defaultUnitId as any);
      setActive(product.active);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !defaultUnitId) {
      setError('Tên và đơn vị mặc định là bắt buộc');
      return;
    }

    if (!product) {
      setError('Không tìm thấy sản phẩm');
      return;
    }

    try {
      await updateProduct({ id: product._id, name, defaultUnitId: defaultUnitId as any, active });
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Cập nhật sản phẩm thất bại');
    }
  };

  if (!product || !unitsData) {
    return <div>Đang tải...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sửa thông tin sản phẩm</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 text-gray-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="defaultUnitId">Đơn vị mặc định</Label>
            <Select onValueChange={setDefaultUnitId} value={defaultUnitId} required>
                <SelectTrigger>
                    <SelectValue placeholder="Chọn một đơn vị" />
                </SelectTrigger>
                <SelectContent>
                    {units.map((unit: any) => (
                        <SelectItem key={String(unit._id)} value={String(unit._id)}>
                            {unit.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="active">Kích hoạt</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Lưu thay đổi</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Hủy
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
