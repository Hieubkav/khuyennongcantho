"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function UnitCreatePage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Created (mock)");
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Unit</CardTitle>
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
