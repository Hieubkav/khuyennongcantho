'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMarketsPage() {
  const markets = useQuery(api.markets.list, { limit: 100 });
  const deleteMarket = useMutation(api.markets.deleteMarket);
  const [selectedMarkets, setSelectedMarkets] = useState<Set<any>>(new Set());

  const handleDelete = async (id: any) => {
    try {
      await deleteMarket({ id });
      toast.success('Xóa chợ thành công');
      // Remove from selected markets if it was selected
      const newSelected = new Set(selectedMarkets);
      newSelected.delete(id);
      setSelectedMarkets(newSelected);
    } catch (error: any) {
      toast.error('Xóa chợ thất bại: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedMarkets).map((id: any) => deleteMarket({ id } as any));
      await Promise.all(promises);
      toast.success(`Xóa ${selectedMarkets.size} chợ thành công`);
      setSelectedMarkets(new Set());
    } catch (error: any) {
      toast.error('Xóa chợ thất bại: ' + error.message);
    }
  };

  const toggleSelectAll = () => {
    if (!markets) return;
    
    if (selectedMarkets.size === markets.markets.length) {
      setSelectedMarkets(new Set());
    } else {
      setSelectedMarkets(new Set(markets.markets.map((m: any) => m._id)));
    }
  };

  const toggleSelect = (id: any) => {
    const newSelected = new Set(selectedMarkets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMarkets(newSelected);
  };

  if (!markets) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quản lý chợ</CardTitle>
          <div className="flex space-x-2">
            {selectedMarkets.size > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa ({selectedMarkets.size})
              </Button>
            )}
            <Button asChild>
              <Link href="/admin/markets/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm chợ
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {markets.markets.length === 0 ? (
            <p>Không tìm thấy chợ nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Checkbox
                        checked={selectedMarkets.size === markets.markets.length && markets.markets.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa điểm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {markets.markets.map((market: any) => (
                    <tr key={market._id} className={selectedMarkets.has(market._id) ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedMarkets.has(market._id)}
                          onCheckedChange={() => toggleSelect(market._id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{market.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{market.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{market.location || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${market.active ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-500'}`}>
                          {market.active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/markets/${market.slug}/edit`}>Sửa</Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(market._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
