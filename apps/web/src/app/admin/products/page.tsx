'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Fetch real units from Convex
const apiAny = api as any;

export default function AdminProductsPage() {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [defaultUnitId, setDefaultUnitId] = useState('');
  const [error, setError] = useState('');

  const products = useQuery(api.products.list, { limit: 100 });
  const unitsData = useQuery(apiAny.units.list, { active: true, limit: 200 });
  const createProduct = useMutation(api.products.create);

  const units = unitsData?.units ?? [];
  const unitNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of units) {
      m.set(u._id as unknown as string, u.name as string);
    }
    return m;
  }, [units]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!slug || !name || !defaultUnitId) {
      setError('Slug, name, and default unit are required');
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      await createProduct({ slug, name, defaultUnitId: (defaultUnitId as unknown) as any });
      // Reset form
      setSlug('');
      setName('');
      setDefaultUnitId('');
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    }
  };

  if (!products || !unitsData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Product</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g., xoai-cat"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Xoài Cát"
                required
              />
            </div>
            <div>
              <Label htmlFor="defaultUnitId">Default Unit</Label>
              <select
                id="defaultUnitId"
                value={defaultUnitId}
                onChange={(e) => setDefaultUnitId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a unit</option>
                {units.map((unit: any) => (
                  <option key={String(unit._id)} value={String(unit._id)}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Create Product</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.products.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {unitNameById.get(product.defaultUnitId as unknown as string) || String(product.defaultUnitId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.active ? 'Active' : 'Inactive'}
                        </span>
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
