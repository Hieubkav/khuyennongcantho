'use client';

import { use } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const apiAny = api as any;

export default function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const unit = useQuery(apiAny.units.getById, { id: id as any });
  const updateUnit = useMutation(apiAny.units.update);
  const router = useRouter();

  if (!unit) return <div>Đang tải...</div>;
  if (!unit?._id) return <div>Không tìm thấy đơn vị</div>;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = String(formData.get('code') || '').trim();
    const name = String(formData.get('name') || '').trim();
    const active = formData.get('active') === 'on';

    try {
      await updateUnit({ id: unit._id, code, name, active } as any);
      toast.success('Cập nhật thành công');
      router.push('/admin/units');
    } catch (e: any) {
      toast.error(e.message || 'Cập nhật thất bại');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sửa đơn vị</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Mã</Label>
            <Input id="code" name="code" defaultValue={unit.code} required />
          </div>
          <div>
            <Label htmlFor="name">Tên</Label>
            <Input id="name" name="name" defaultValue={unit.name} required />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="active" name="active" defaultChecked={unit.active} />
            <Label htmlFor="active">Hoạt động</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Lưu</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Huỷ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

