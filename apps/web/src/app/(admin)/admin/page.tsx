"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AdminPage() {
  const search = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const flag = search.get("unauthorized");
    if (flag) {
      toast.error("Bạn không có quyền truy cập khu vực này.");
      const params = new URLSearchParams(search as any);
      params.delete("unauthorized");
      // Để đơn giản và an toàn điều hướng, quay lại /admin
      router.replace("/admin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to the Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Quick links and overview will be displayed here.</p>
      </CardContent>
    </Card>
  );
}

