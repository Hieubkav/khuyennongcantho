"use client";
import { useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";

export default function Home() {
  const healthCheck = useQuery(api.healthCheck.get);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <h1 className="mb-4 text-xl font-semibold">Welcome</h1>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck === "OK" ? "bg-green-500" : healthCheck === undefined ? "bg-orange-400" : "bg-red-500"}`}
            />
            <span className="text-sm text-muted-foreground">
              {healthCheck === undefined
                ? "Checking..."
                : healthCheck === "OK"
                ? "Connected"
                : "Error"}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

