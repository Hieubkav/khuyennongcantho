'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const apiAny = api as any;

export default function AdminPricesPage() {
  const { data: session } = useSession();
  const profileId = (session?.user as any)?.id as string | undefined;
  // Form state
  const [marketId, setMarketId] = useState('');
  const [productId, setProductId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [noteType, setNoteType] = useState('');
  const [error, setError] = useState('');

  // Data fetching
  const markets = useQuery(api.markets.list, { limit: 200 });
  const products = useQuery(api.products.list, { limit: 200 });
  const unitsData = useQuery(apiAny.units.list, { active: true, limit: 200 });
  const prices = useQuery(api.prices.list, { limit: 50 });
  
  // Mutations
  const upsertPrice = useMutation(api.prices.upsert);

  // Create lookup maps for names
  const marketNameById = useMemo(() => {
    const m = new Map<string, string>();
    if (markets) {
      for (const market of markets.markets) {
        m.set(market._id as unknown as string, market.name);
      }
    }
    return m;
  }, [markets]);

  const productNameById = useMemo(() => {
    const m = new Map<string, string>();
    if (products) {
      for (const product of products.products) {
        m.set(product._id as unknown as string, product.name);
      }
    }
    return m;
  }, [products]);

  const unitNameById = useMemo(() => {
    const m = new Map<string, string>();
    if (unitsData) {
      for (const unit of unitsData.units) {
        m.set(unit._id as unknown as string, unit.name);
      }
    }
    return m;
  }, [unitsData]);

  // Handle product selection to auto-select default unit
  const handleProductSelect = (value: string) => {
    setProductId(value);
    
    // Find the product and auto-select its default unit
    const product = products?.products.find((p: any) => p._id === value);
    if (product) {
      setUnitId(product.defaultUnitId);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!marketId || !productId || !unitId || !date || !price) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Giá phải là số dương');
      return;
    }

    // Allow any date - no validation on future dates

    try {
      await upsertPrice({
        marketId: marketId as any,
        productId: productId as any,
        unitId: unitId as any,
        date,
        price: priceNum,
        notes: notes || undefined,
        noteType: (noteType as any) || undefined,
        createdBy: (profileId as any) || undefined,
      });
      
      toast.success('Lưu giá thành công');
      
      // Reset form
      setMarketId('');
      setProductId('');
      setUnitId('');
      setDate('');
      setPrice('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Lưu giá thất bại');
      toast.error(err.message || 'Lưu giá thất bại');
    }
  };

  // Loading states
  if (!markets || !products || !unitsData || !prices) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nhập giá sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="market">Chợ</Label>
                <Select onValueChange={setMarketId} value={marketId} required>
                  <SelectTrigger id="market">
                    <SelectValue placeholder="Chọn chợ" />
                  </SelectTrigger>
                  <SelectContent>
                    {markets.markets.map((market: any) => (
                      <SelectItem key={market._id} value={market._id}>
                        {market.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="product">Sản phẩm</Label>
                <Select onValueChange={handleProductSelect} value={productId} required>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.products.map((product: any) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="unit">Đơn vị</Label>
                <Select onValueChange={setUnitId} value={unitId} required>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsData.units.map((unit: any) => (
                      <SelectItem key={unit._id} value={unit._id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Đơn vị mặc định sẽ được chọn tự động khi chọn sản phẩm. Bạn có thể thay đổi nếu cần.
                </p>
              </div>
              
              <div>
                <Label htmlFor="date">Ngày</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Mặc định là ngày hiện tại. Bạn có thể thay đổi nếu cần.
                </p>
              </div>
              
              <div>
                <Label htmlFor="price">Giá</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="100"
                  placeholder="Nhập giá"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Ghi chú (tuỳ chọn)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú"
              />
            </div>
            
            <Button type="submit">Lưu giá</Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Danh sách giá gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {prices.prices.length === 0 ? (
            <p>Không có giá nào được nhập.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chợ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prices.prices.map((priceRecord: any) => (
                    <tr key={priceRecord._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {marketNameById.get(priceRecord.marketId as unknown as string) || priceRecord.marketId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {productNameById.get(priceRecord.productId as unknown as string) || priceRecord.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{priceRecord.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unitNameById.get(priceRecord.unitId as unknown as string) || priceRecord.unitId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceRecord.price)}
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
