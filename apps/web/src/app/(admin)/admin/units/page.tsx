'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { PlusCircle, Trash2, RefreshCcw, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

const apiAny = api as any;

export default function AdminUnitsPage() {
  const data = useQuery(apiAny.units.list, { limit: 200 });
  const seedUnits = useMutation(apiAny.seeds.seedUnits);
  const updateUnit = useMutation(apiAny.units.update);
  const deleteUnit = useMutation(apiAny.units.deleteUnit);

  const [selected, setSelected] = useState<Set<any>>(new Set());

  const units = data?.units ?? [];
  const activeCount = useMemo(() => units.filter((u: any) => u.active).length, [units]);

  const toggleSelectAll = () => {
    if (selected.size === units.length) setSelected(new Set());
    else setSelected(new Set(units.map((u: any) => u._id)));
  };

  const toggleSelect = (id: any) => {
    const ns = new Set(selected);
    if (ns.has(id)) ns.delete(id);
    else ns.add(id);
    setSelected(ns);
  };

  const handleToggleActive = async (u: any) => {
    try {
      await updateUnit({ id: u._id, active: !u.active } as any);
      toast.success(!u.active ? 'Đã kích hoạt đơn vị' : 'Đã vô hiệu hóa đơn vị');
    } catch (e: any) {
      toast.error(e.message || 'Thao tác thất bại');
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteUnit({ id } as any);
      toast.success('Xoá đơn vị thành công');
      const ns = new Set(selected);
      ns.delete(id);
      setSelected(ns);
    } catch (e: any) {
      toast.error(e.message || 'Xoá đơn vị thất bại');
    }
  };

  const handleSeed = async () => {
    try {
      await seedUnits({} as any);
      toast.success('Đã khôi phục dữ liệu đơn vị mẫu');
    } catch (e: any) {
      toast.error(e.message || 'Khôi phục thất bại');
    }
  };

  if (!data) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quản lý đơn vị</CardTitle>
          <div className="flex space-x-2">
            {units.length === 0 || activeCount === 0 ? (
              <Button variant="outline" onClick={handleSeed}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Khôi phục đơn vị mẫu
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/admin/units/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Thêm đơn vị
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <p>Chưa có đơn vị nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Checkbox
                        checked={selected.size === units.length && units.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {units.map((u: any) => (
                    <tr key={String(u._id)} className={selected.has(u._id) ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox checked={selected.has(u._id)} onCheckedChange={() => toggleSelect(u._id)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{u.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.active ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-500'}`}>
                          {u.active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/units/${String(u._id)}/edit`}>Sửa</Link>
                        </Button>
                        <Button
                          variant={u.active ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                          disabled={u.active && activeCount <= 1}
                          title={u.active && activeCount <= 1 ? 'Không thể vô hiệu hoá đơn vị cuối cùng' : ''}
                        >
                          {u.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(u._id)}
                          disabled={u.active && activeCount <= 1}
                          title={u.active && activeCount <= 1 ? 'Không thể xoá đơn vị cuối cùng' : ''}
                        >
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

