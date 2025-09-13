"use client";

import { useSettings } from "@/hooks/useSettings";

export function SiteName() {
  const { siteName } = useSettings();
  return (
    <div className="hidden md:block font-semibold text-base truncate max-w-[30vw]">
      {siteName}
    </div>
  );
}

