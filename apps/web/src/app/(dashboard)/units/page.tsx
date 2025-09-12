"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getMockUnits, type Unit } from "@/lib/mock/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function UnitsListPage() {
  const [q, setQ] = useState("");
  const data = useMemo(() => getMockUnits(), []);

  const filtered: Unit[] = useMemo(() => {
    if (!q) return data;
    const s = q.toLowerCase();
    return data.filter((u) =>
      [u.code, u.name, u.description ?? ""].some((t) => t.toLowerCase().includes(s))
    );
  }, [q, data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Units</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              className="pl-8 w-64"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/units/new">
              <Plus className="mr-2 h-4 w-4" /> New Unit
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unit List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{u.code}</td>
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{u.description}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          u.status === "active"
                            ? "inline-flex items-center gap-1 text-green-600"
                            : "inline-flex items-center gap-1 text-gray-500"
                        }
                      >
                        <BadgeCheck className="h-4 w-4" />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2 pr-0">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/units/${u.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => toast.error(`Delete ${u.name} not implemented`)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No results
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

