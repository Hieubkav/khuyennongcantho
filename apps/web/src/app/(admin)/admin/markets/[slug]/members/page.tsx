'use client';

import { use } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const apiAny = api as any;

export default function MarketMembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const market = useQuery(api.markets.bySlug, { slug });
  const members = useQuery(apiAny.marketMembers.listByMarket, market ? { marketId: market._id, active: true } : 'skip');
  const profiles = useQuery(api.profiles.list, { role: 'member' as any, limit: 500 });

  const assign = useMutation(apiAny.marketMembers.assign);
  const unassign = useMutation(apiAny.marketMembers.unassign);

  if (!market || !members || !profiles) return <div>Đang tải...</div>;

  const assignedSet = new Set(members.map((m: any) => String(m.profileId)));

  const handleToggle = async (profileId: any) => {
    try {
      if (assignedSet.has(String(profileId))) {
        await unassign({ marketId: market._id, profileId });
        toast.success('Đã gỡ quyền');
      } else {
        await assign({ marketId: market._id, profileId });
        toast.success('Đã cấp quyền');
      }
    } catch (e: any) {
      toast.error(e.message || 'Thao tác thất bại');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân quyền thành viên cho chợ: {market.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium">Tên</th>
                <th className="px-4 py-2 text-left text-xs font-medium">Trạng thái</th>
                <th className="px-4 py-2 text-right text-xs font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profiles.map((p: any) => {
                const assigned = assignedSet.has(String(p._id));
                return (
                  <tr key={String(p._id)}>
                    <td className="px-4 py-2">{p.email}</td>
                    <td className="px-4 py-2">{p.name ?? '-'}</td>
                    <td className="px-4 py-2">{assigned ? 'Đã cấp quyền' : 'Chưa cấp'}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant={assigned ? 'destructive' : 'outline'} size="sm" onClick={() => handleToggle(p._id)}>
                        {assigned ? 'Gỡ' : 'Cấp quyền'}
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

