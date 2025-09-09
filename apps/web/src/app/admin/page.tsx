import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-bold">Welcome to Admin Dashboard</h1>
      <p className="mb-6">This is the admin dashboard for managing markets and products.</p>
      <div className="flex space-x-4">
        <Button asChild>
          <Link href="/admin/markets">Manage Markets</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/products">Manage Products</Link>
        </Button>
      </div>
    </div>
  );
}