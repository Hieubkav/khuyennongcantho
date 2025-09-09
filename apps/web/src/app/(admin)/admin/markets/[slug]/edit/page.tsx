'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

export default function EditMarketPage({ params }: { params: { slug: string } }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const market = useQuery(api.markets.bySlug, { slug: params.slug });
  const updateMarket = useMutation(api.markets.update);
  const router = useRouter();

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
    <Card>
      <CardHeader>
        <CardTitle>Sửa thông tin chợ</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 text-gray-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên chợ</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Địa điểm (tùy chọn)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
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
