import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";
import Providers from "@/components/providers";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <Providers session={session}>
      <div className="flex min-h-svh bg-background text-foreground">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopbar />
          <main className="flex-1 mx-auto max-w-7xl w-full p-6">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
