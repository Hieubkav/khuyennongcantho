"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getMockUnits } from "@/lib/mock/units";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function UnitEditClient({ id }: { id: string }) {
  const units = useMemo(() => getMockUnits(), []);
  const current = useMemo(() => units.find((u) => u.id === id), [units, id]);

  const [code, setCode] = useState(current?.code ?? "");
  const [name, setName] = useState(current?.name ?? "");
  const [description, setDescription] = useState(current?.description ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Updated (mock)");
  };

  if (!current) {
    return (
      <div className="text-sm text-muted-foreground">Unit not found. Go back to <Link className="underline" href="/units">list</Link>.</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Unit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/units">Cancel</Link>
            </Button>
            <Button type="submit">Save</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
