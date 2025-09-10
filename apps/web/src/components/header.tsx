"use client";
import Link from "next/link";
import type { Route } from "next";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const links: ReadonlyArray<{ to: Route; label: string }> = [
    { to: "/(site)" as Route, label: "Trang chủ" },
    { to: "/news" as Route, label: "Tin tức" },
    { to: "/docs" as Route, label: "Kỹ thuật" },
    { to: "/prices" as Route, label: "Giá cả" },
    { to: "/about" as Route, label: "Giới thiệu" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href={("/(site)" as Route)} className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">Khuyến Nông Cần Thơ</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">{/* TODO: Add search */}</div>
          <nav className="flex items-center">
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}

