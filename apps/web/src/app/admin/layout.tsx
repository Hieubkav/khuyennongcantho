import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Button asChild variant="outline">
              <Link href="/admin">Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/markets">Markets</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/products">Products</Link>
            </Button>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}