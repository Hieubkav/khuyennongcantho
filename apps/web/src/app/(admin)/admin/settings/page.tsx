'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAction } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const changePassword = useAction(api.auth.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = session?.user?.email as string | undefined;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Bạn cần đăng nhập lại.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải từ 6 ký tự');
      return;
    }
    try {
      setLoading(true);
      await changePassword({ email, currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Đổi mật khẩu thất bại');
      toast.error(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt tài khoản</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 max-w-md">
          <div>
            <Label>Email</Label>
            <Input value={email ?? ''} disabled />
          </div>
          <div>
            <Label>Mật khẩu hiện tại</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <Label>Mật khẩu mới</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <Label>Xác nhận mật khẩu mới</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Đổi mật khẩu'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

