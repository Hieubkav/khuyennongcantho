'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/slugify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const apiAny = api as any;

export default function CreateProductPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [defaultUnitId, setDefaultUnitId] = useState('');
  const [error, setError] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const createProduct = useMutation(api.products.create);
  const unitsData = useQuery(apiAny.units.list, { active: true, limit: 200 });
  const units = unitsData?.units ?? [];
  const router = useRouter();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!slugManuallyEdited) {
      setSlug(slugify(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugManuallyEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!slug || !name || !defaultUnitId) {
      setError('Tên, slug và đơn vị mặc định là bắt buộc');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug chỉ có thể chứa chữ thường, số và dấu gạch ngang');
      return;
    }

    try {
      await createProduct({ slug, name, defaultUnitId: defaultUnitId as any });
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Tạo sản phẩm thất bại');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo sản phẩm mới</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 text-gray-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="VD: Xoài Cát Hòa Lộc"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={handleSlugChange}
              placeholder="VD: xoai-cat-hoa-loc"
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
          <div className="flex gap-2">
            <Button type="submit">Tạo sản phẩm</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Hủy
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
