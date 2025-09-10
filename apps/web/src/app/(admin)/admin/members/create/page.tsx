'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function CreateMemberPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const create = useAction(api.auth.createUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await create({ email, name: name || undefined, role, password });
      router.push('/admin/members');
    } catch (err: any) {
      setError(err.message || 'Tạo thành viên thất bại');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thêm thành viên</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 text-gray-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="name">Tên (tuỳ chọn)</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="role">Vai trò</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">member</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Tạo thành viên</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>Huỷ</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

