'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@dohy/backend/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const apiAny = api as any;

export default function RoundsIndexPage() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role ?? 'member') as 'admin' | 'member';
  const profileId = (session?.user as any)?.id as string | undefined;

  const marketsAll = useQuery(api.markets.list, { limit: 500 });
  const myMemberships = useQuery(
    apiAny.marketMembers.listByProfile,
    profileId ? { profileId: profileId as any, active: true } : 'skip'
  );

  const [marketId, setMarketId] = useState<string>('');
  const [forDate, setForDate] = useState<string>('');

  const markets = useMemo(() => {
    if (!marketsAll) return [] as any[];
    if (role === 'admin' || !myMemberships) return marketsAll.markets;
    const allowed = new Set(myMemberships.map((m: any) => String(m.marketId)));
    return marketsAll.markets.filter((m: any) => allowed.has(String(m._id)));
  }, [marketsAll, myMemberships, role]);

  useEffect(() => {
    if (!marketId && markets && markets.length > 0) setMarketId(String(markets[0]._id));
  }, [markets, marketId]);

  const rounds = useQuery(apiAny.priceRounds.listWithStatus, {
    marketId: marketId ? (marketId as any) : undefined,
    forDate: forDate || undefined,
    limit: 50,
  }) as Array<{ round: any; productCount: number; filledCount: number; completion: number }> | undefined;

  // Build profile map for managers across rounds
  const managerIds = useMemo(() => {
    if (!Array.isArray(rounds)) return [] as string[];
    const ids = new Set<string>();
    for (const x of rounds) {
      const r = x.round;
      const mid = String(((r.managerId as any)?.id ?? r.managerId) || '');
      if (mid) ids.add(mid);
    }
    return Array.from(ids);
  }, [rounds]);

  const managerProfiles = useQuery(
    apiAny.profiles.getManyPublic,
    managerIds.length ? { ids: managerIds as any } : 'skip'
  ) as any[] | 'skip' | undefined;

  const managerProfileMap = useMemo(() => {
    const m = new Map<string, any>();
    if (Array.isArray(managerProfiles)) for (const p of managerProfiles) m.set(String(p._id), p);
    return m;
  }, [managerProfiles]);

  // Admin actions (guard against missing admin mutations)
  const removeRound = useMutation(
    (apiAny.priceRoundsAdmin && apiAny.priceRoundsAdmin.remove) ||
      ((_: any) => {
        throw new Error('remove not available');
      })
  );
  const updateForDate = useMutation(
    (apiAny.priceRoundsAdmin && apiAny.priceRoundsAdmin.updateForDate) ||
      ((_: any) => {
        throw new Error('updateForDate not available');
      })
  );
  const closeRound = useMutation(
    (apiAny.priceRounds && apiAny.priceRounds.close) ||
      ((_: any) => {
        throw new Error('close not available');
      })
  );
  const reopenRound = useMutation(
    (apiAny.priceRoundsAdmin && apiAny.priceRoundsAdmin.reopen) ||
      ((_: any) => {
        throw new Error('reopen not available');
      })
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');

  const startEdit = (r: any) => {
    setEditingId(String(r._id));
    setEditingDate(r.forDate);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingDate('');
  };
  const saveEdit = async (rid: string) => {
    if (!editingDate) return;
    try {
      await updateForDate({ roundId: rid as any, forDate: editingDate });
      toast.success('Đã cập nhật ngày');
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật thất bại');
    } finally {
      cancelEdit();
    }
  };

  const doDelete = async (rid: string) => {
    if (!confirm('Xóa đợt này? Chỉ đợt chưa có dữ liệu giá mới xóa được.')) return;
    try {
      await removeRound({ roundId: rid as any });
      toast.success('Đã xóa đợt');
    } catch (e: any) {
      toast.error(e?.message || 'Xóa thất bại');
    }
  };

  if (!marketsAll || (role !== 'admin' && !myMemberships)) return <div>Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Đợt lấy giá</CardTitle>
          {role === 'admin' && (
            <Link href="/admin/rounds/create">
              <Button>Tạo đợt mới</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Chợ</Label>
              <Select value={marketId} onValueChange={setMarketId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chợ" />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((m: any) => (
                    <SelectItem key={String(m._id)} value={String(m._id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ngày</Label>
              <Input type="date" value={forDate} onChange={(e) => setForDate(e.target.value)} />
            </div>
          </div>

          {!rounds ? (
            <div>Đang tải...</div>
          ) : rounds.length === 0 ? (
            <div className="text-sm">Không có đợt nào.</div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden grid gap-3">
                {rounds.map((x: any) => {
                  const r = x.round;
                  const marketIdStr = String(((r.marketId as any).id ?? r.marketId));
                  const marketName =
                    marketsAll?.markets?.find((m: any) => String(m._id) === marketIdStr)?.name || marketIdStr;
                  const managerId = String(((r.managerId as any)?.id ?? r.managerId) || '');
                  const mp = managerId ? managerProfileMap.get(managerId) : undefined;
                  const managerLabel = mp?.name || mp?.email || managerId || '-';
                  const percent = Math.round((x.completion ?? 0) * 100);
                  return (
                    <div key={String(r._id)} className="rounded border p-3 bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{marketName}</div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">{r.forDate}</div>
                      </div>
                      <div className="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1">
                        <div>
                          Tổng mục: <span className="font-medium">{x.productCount}</span>
                        </div>
                        <div>
                          Đã nhập: <span className="font-medium">{x.filledCount}</span>
                        </div>
                        <div>
                          Phụ trách: <span className="font-medium">{managerLabel}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="text-right text-xs mt-1">{percent}%</div>
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        <Link href={`/admin/rounds/${String(r._id)}/edit`}>
                          <Button size="sm" variant="outline">
                            Mở
                          </Button>
                        </Link>
                        {role === 'admin' && (
                          <>
                            {editingId === String(r._id) ? (
                              <>
                                <Input
                                  type="date"
                                  value={editingDate}
                                  onChange={(e) => setEditingDate(e.target.value)}
                                  className="h-8 w-[9.5rem]"
                                />
                                <Button size="sm" onClick={() => saveEdit(String(r._id))}>
                                  Lưu
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                  Hủy
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
                                Sửa
                              </Button>
                            )}
                            {r.status === 'open' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    await closeRound({ roundId: r._id });
                                  } catch (e: any) {
                                    toast.error(e?.message || 'Đóng thất bại');
                                  }
                                }}
                              >
                                Đóng
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    await reopenRound({ roundId: r._id });
                                  } catch (e: any) {
                                    toast.error(e?.message || 'Mở thất bại');
                                  }
                                }}
                              >
                                Mở lại
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => doDelete(String(r._id))}>
                              Xóa
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium">Chợ</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Ngày</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Số mục</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Đã nhập</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Phụ trách</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Hoàn thành</th>
                      <th className="px-4 py-2 text-right text-xs font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rounds.map((x: any) => {
                      const r = x.round;
                      const marketIdStr = String(((r.marketId as any).id ?? r.marketId));
                      const marketName =
                        marketsAll?.markets?.find((m: any) => String(m._id) === marketIdStr)?.name || marketIdStr;
                      const managerId = String(((r.managerId as any)?.id ?? r.managerId) || '');
                      const mp = managerId ? managerProfileMap.get(managerId) : undefined;
                      const managerLabel = mp?.name || mp?.email || managerId || '-';
                      const done = x.productCount > 0 && x.productCount === x.filledCount;
                      return (
                        <tr key={String(r._id)}>
                          <td className="px-4 py-2 whitespace-nowrap">{marketName}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {editingId === String(r._id) ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="date"
                                  value={editingDate}
                                  onChange={(e) => setEditingDate(e.target.value)}
                                  className="h-8"
                                />
                                <Button size="sm" onClick={() => saveEdit(String(r._id))}>
                                  Lưu
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                  Hủy
                                </Button>
                              </div>
                            ) : (
                              r.forDate
                            )}
                          </td>
                          <td className="px-4 py-2">{x.productCount}</td>
                          <td className="px-4 py-2">{x.filledCount}</td>
                          <td className="px-4 py-2">{managerLabel}</td>
                          <td className="px-4 py-2">{done ? 'Hoàn thành' : 'Chưa hoàn thành'}</td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/admin/rounds/${String(r._id)}/edit`}>
                                <Button size="sm" variant="outline">
                                  Mở
                                </Button>
                              </Link>
                              {role === 'admin' && (
                                <>
                                  {editingId !== String(r._id) && (
                                    <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
                                      Sửa
                                    </Button>
                                  )}
                                  {r.status === 'open' ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={async () => {
                                        try {
                                          await closeRound({ roundId: r._id });
                                        } catch (e: any) {
                                          toast.error(e?.message || 'Đóng thất bại');
                                        }
                                      }}
                                    >
                                      Đóng
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={async () => {
                                        try {
                                          await reopenRound({ roundId: r._id });
                                        } catch (e: any) {
                                          toast.error(e?.message || 'Mở thất bại');
                                        }
                                      }}
                                    >
                                      Mở lại
                                    </Button>
                                  )}
                                  <Button size="sm" variant="destructive" onClick={() => doDelete(String(r._id))}>
                                    Xóa
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
