"use client";

import { useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";

export function useSettings() {
  const data = useQuery(api.settings.get, {} as any);
  return {
    siteName: data?.siteName ?? "",
    pageSize: data?.pageSize ?? 10,
    loading: data === undefined,
  } as const;
}
