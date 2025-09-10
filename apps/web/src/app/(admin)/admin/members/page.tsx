'use client';

import { useQuery, useAction } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';

const apiAny = api as any;

export default function AdminMembersPage() {
  const profiles = useQuery(api.profiles.list, { limit: 200 });
  const markets = useQuery(api.markets.list, { limit: 500 });
  const memberIds = profiles ? (profiles as any[]).filter((p: any) => p.role === 'member').map((p: any) => p._id) : [];
  const activeAssignments = useQuery(
    apiAny.marketMembers.listActiveByProfiles,
    profiles ? ({ profileIds: memberIds } as any) : 'skip'
  );
  const issueTempPassword = useAction(api.auth.issueTempPassword);

  if (!profiles || !markets || (profiles && activeAssignments === undefined)) return <div>Dang t?i...</div>;

  const marketNameById = new Map<string, string>(
    (markets as any).markets.map((m: any) => [String(m._id), m.name])
  );
  const assignedByProfile = new Map<string, string[]>();
  for (const a of (activeAssignments as any[] | undefined) ?? []) {
    const pid = String((a as any).profileId?.id ?? (a as any).profileId);
    const mid = String((a as any).marketId?.id ?? (a as any).marketId);
    const name = marketNameById.get(mid) ?? '(Chợ đã xoá)';
    const arr = assignedByProfile.get(pid) ?? [];
    arr.push(name);
    assignedByProfile.set(pid, arr);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quản lý thành viên</CardTitle>
          <Button asChild>
            <Link href="/admin/members/create">Thêm thành viên</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p>Chưa có thành viên nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đang quản lý chợ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(profiles as any[]).map((p: any) => {
                    const names = assignedByProfile.get(String(p._id)) ?? [];
                    const managingText = p.role === 'admin' ? '-' : names.length > 0 ? names.join(', ') : 'Không quản lý';
                    return (
                      <tr key={String(p._id)}>
                        <td className="px-6 py-4 whitespace-nowrap">{p.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{p.name ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{p.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{managingText}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{p.active ? 'Hoạt động' : 'Khoá'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex gap-2 justify-end">
                            <Button asChild variant="outline" size="sm">
                              <a href={`/admin/members/${String(p._id)}`}>Chi tiết</a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await issueTempPassword({ profileId: p._id } as any);
                                  const pwd = (res as any)?.password as string;
                                  await navigator.clipboard.writeText(pwd);
                                  toast.success(`Đã cấp mật khẩu tạm và copy vào clipboard`);
                                } catch (err: any) {
                                  toast.error(err.message || 'Cấp mật khẩu tạm thất bại');
                                }
                              }}
                            >
                              Cấp mật khẩu tạm
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

