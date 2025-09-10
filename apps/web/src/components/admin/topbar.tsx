"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Menu } from "lucide-react";

export default function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="bg-white border-b border-gray-200 text-gray-900">
      <div className="mx-auto max-w-4xl sm:max-w-6xl lg:max-w-7xl px-3 sm:px-4 py-3 flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold truncate">Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => signOut({ redirectTo: "/login" })}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
