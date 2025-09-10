import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/shell";
import Providers from "@/components/providers";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <Providers session={session}>
      <AdminShell>{children}</AdminShell>
    </Providers>
  );
}
