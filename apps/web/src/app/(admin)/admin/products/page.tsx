'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const apiAny = api as any;

function ProductMarketCountCell({ productId }: { productId: any }) {
  const links = useQuery(apiAny.marketProducts.listByProduct, { productId, active: true } as any) as any[] | undefined;
  const count = links ? links.length : 0;
  return <td className="px-6 py-4 whitespace-nowrap">{count}</td>;
}

export default function AdminProductsPage() {
  const products = useQuery(api.products.list, { limit: 100 });
  const unitsData = useQuery(apiAny.units.list, { active: true, limit: 200 });
  const deleteProduct = useMutation(api.products.deleteProduct);
  const [selectedProducts, setSelectedProducts] = useState<Set<any>>(new Set());

  const units = unitsData?.units ?? [];
  const unitNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of units) m.set(u._id as unknown as string, u.name as string);
    return m;
  }, [units]);

  const handleDelete = async (id: any) => {
    try {
      await deleteProduct({ id });
      toast.success('Xóa sản phẩm thành công');
      const newSelected = new Set(selectedProducts);
      newSelected.delete(id);
      setSelectedProducts(newSelected);
    } catch (error: any) {
      toast.error('Xóa sản phẩm thất bại: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedProducts).map((id: any) => deleteProduct({ id } as any));
      await Promise.all(promises);
      toast.success(`Đã xóa ${selectedProducts.size} sản phẩm`);
      setSelectedProducts(new Set());
    } catch (error: any) {
      toast.error('Xóa sản phẩm thất bại: ' + error.message);
    }
  };

  const toggleSelectAll = () => {
    if (!products) return;
    if (selectedProducts.size === products.products.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(products.products.map((p: any) => p._id)));
  };

  const toggleSelect = (id: any) => {
    const ns = new Set(selectedProducts);
    if (ns.has(id)) ns.delete(id);
    else ns.add(id);
    setSelectedProducts(ns);
  };

  if (!products || !unitsData) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quản lý sản phẩm</CardTitle>
          <div className="flex space-x-2">
            {selectedProducts.size > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedProducts.size})
              </Button>
            )}
            <Button asChild>
              <Link href="/admin/products/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Thêm sản phẩm
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.products.length === 0 ? (
            <p>Không tìm thấy sản phẩm nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Checkbox
                        checked={selectedProducts.size === products.products.length && products.products.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị mặc định</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số chợ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.products.map((product: any) => (
                    <tr key={product._id} className={selectedProducts.has(product._id) ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedProducts.has(product._id)}
                          onCheckedChange={() => toggleSelect(product._id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unitNameById.get(product.defaultUnitId as unknown as string) || String(product.defaultUnitId)}
                      </td>
                      <ProductMarketCountCell productId={product._id} />
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.active ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-500'}`}>
                          {product.active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/products/${product.slug}/edit`}>Sửa</Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(product._id)}>
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

