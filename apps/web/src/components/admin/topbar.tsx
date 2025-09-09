"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function AdminTopbar() {
  return (
    <header className="bg-white border-b border-gray-200 text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => signOut({ redirectTo: "/login" })}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
