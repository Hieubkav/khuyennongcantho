'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/slugify';

export default function CreateMarketPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const createMarket = useMutation(api.markets.create);
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

    if (!slug || !name) {
      setError('Tên và slug là bắt buộc');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug chỉ có thể chứa chữ thường, số và dấu gạch ngang');
      return;
    }

    try {
      await createMarket({ slug, name, location: location || undefined });
      router.push('/admin/markets');
    } catch (err: any) {
      setError(err.message || 'Tạo chợ thất bại');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo chợ mới</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 text-gray-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên chợ</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="VD: Chợ Cái Răng"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={handleSlugChange}
              placeholder="VD: cho-cai-rang"
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Địa điểm (tùy chọn)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="VD: Cần Thơ"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Tạo chợ</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Hủy
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
