import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsAdminOnlyLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || role !== "admin") redirect("/admin?unauthorized=1");
  return <>{children}</>;
}
