import { ModeToggle } from "@/components/mode-toggle";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid h-svh w-full grid-cols-[16rem_1fr]">
      <aside className="border-r p-4">
        <div className="mb-6 text-lg font-semibold">Dashboard</div>
        <nav className="grid gap-2 text-sm">
          <a href="/dashboard" className="text-foreground/80 hover:text-foreground">Overview</a>
          <a href="/dashboard/reports" className="text-foreground/80 hover:text-foreground">Reports</a>
          <a href="/dashboard/settings" className="text-foreground/80 hover:text-foreground">Settings</a>
        </nav>
      </aside>
      <div className="grid grid-rows-[auto_1fr]">
        <header className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-base font-medium">Dashboard</h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>
        <main className="overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}

