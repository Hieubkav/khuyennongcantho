'use client';

import { use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const apiAny = api as any;

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const profile = useQuery(api.profiles.getById, { id: id as any });
  const markets = useQuery(api.markets.list, { limit: 500 });
  const assigned = useQuery(apiAny.marketMembers.listByProfile, profile ? { profileId: profile._id, active: undefined } : 'skip');
  const assign = useMutation(apiAny.marketMembers.assign);
  const unassign = useMutation(apiAny.marketMembers.unassign);

  if (!profile || !markets || !assigned) return <div>Đang tải...</div>;

  const assignedSet = new Set(assigned.filter((m: any) => m.active).map((m: any) => String(m.marketId)));

  const handleToggle = async (marketId: any) => {
    try {
      if (assignedSet.has(String(marketId))) {
        await unassign({ marketId, profileId: profile._id } as any);
        toast.success('Đã gỡ quyền');
      } else {
        await assign({ marketId, profileId: profile._id } as any);
        toast.success('Đã cấp quyền');
      }
    } catch (e: any) {
      toast.error(e.message || 'Thao tác thất bại');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thành viên: {profile.name ?? profile.email}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium">Chợ</th>
                <th className="px-4 py-2 text-left text-xs font-medium">Slug</th>
                <th className="px-4 py-2 text-right text-xs font-medium">Quản lý</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {markets.markets.map((m: any) => {
                const isAssigned = assignedSet.has(String(m._id));
                return (
                  <tr key={String(m._id)}>
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2">{m.slug}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant={isAssigned ? 'outline' : 'default'} onClick={() => handleToggle(m._id)}>
                        {isAssigned ? 'Gỡ' : 'Cấp quyền'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

