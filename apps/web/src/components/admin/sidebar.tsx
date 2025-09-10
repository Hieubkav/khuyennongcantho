"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Store, Boxes, Tags, Users, Settings, ChevronsLeftRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";
import type { Route } from "next";

type Role = "admin" | "member";
const NAV_ITEMS: { href: Route; label: string; icon: any; roles: Role[] }[] = [
  { href: "/admin" as Route, label: "Bảng điều khiển", icon: LayoutDashboard, roles: ["admin", "member"] },
  { href: "/admin/markets" as Route, label: "Quản lý chợ", icon: Store, roles: ["admin"] },
  { href: "/admin/products" as Route, label: "Sản phẩm", icon: Boxes, roles: ["admin"] },
  { href: "/admin/units" as Route, label: "Đơn vị", icon: Tags, roles: ["admin"] },
  { href: "/admin/prices" as Route, label: "Giá cả", icon: Tags, roles: ["admin", "member"] },
  { href: "/admin/rounds" as Route, label: "Đợt giá", icon: Tags, roles: ["admin", "member"] },
  { href: "/admin/members" as Route, label: "Thành viên", icon: Users, roles: ["admin"] },
  { href: "/admin/settings" as Route, label: "Cài đặt", icon: Settings, roles: ["admin"] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role ?? "member") as Role;

  useEffect(() => {
    const stored = localStorage.getItem("adminSidebarCollapsed");
    if (stored) setIsCollapsed(JSON.parse(stored));
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    localStorage.setItem("adminSidebarCollapsed", JSON.stringify(!isCollapsed));
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "border-r border-gray-200 bg-white text-gray-900 p-3 flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && <div className="text-lg font-semibold">Admin</div>}
          <Button variant="ghost" size="icon" onClick={toggleCollapse}>
            <ChevronsLeftRight className="h-4 w-4" />
          </Button>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.filter((it) => it.roles.includes(role)).map((it) => {
            const active = pathname === it.href || pathname?.startsWith(it.href + "/");
            const Icon = it.icon as any;
            return (
              <Tooltip key={it.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-medium",
                      active && "bg-gray-100 border-l-2 border-black",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Link href={it.href}>
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{it.label}</span>}
                    </Link>
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{it.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}

