'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const apiAny = api as any;

export default function CreateUnitPage() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const createUnit = useMutation(apiAny.units.create);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || !name) {
      setError('Mã và Tên là bắt buộc');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(code)) {
      setError('Mã chỉ chứa chữ thường, số, dấu gạch ngang');
      return;
    }
    try {
      await createUnit({ code, name } as any);
      router.push('/admin/units');
    } catch (err: any) {
      setError(err.message || 'Tạo đơn vị thất bại');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thêm đơn vị</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 text-gray-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Mã</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="vd: kg, g, lit" required />
          </div>
          <div>
            <Label htmlFor="name">Tên</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: Kilogram" required />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Tạo</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Huỷ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

