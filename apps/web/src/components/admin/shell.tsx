"use client";

import { useEffect, useRef, useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Simple edge-swipe to open on mobile
  const startX = useRef<number | null>(null);
  const tracking = useRef(false);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (window.innerWidth >= 768) return; // md and up no swipe
      if ((e.clientX ?? 0) <= 16) {
        tracking.current = true;
        startX.current = e.clientX;
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!tracking.current || startX.current == null) return;
      const dx = (e.clientX ?? 0) - startX.current;
      if (dx > 60) {
        setMobileOpen(true);
        tracking.current = false;
        startX.current = null;
      }
    };
    const handlePointerUp = () => {
      tracking.current = false;
      startX.current = null;
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <div className="flex min-h-svh bg-background text-foreground overflow-x-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      <div className="md:hidden">
        <div className={`fixed inset-0 z-40 ${mobileOpen ? "" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-black/30 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <AdminSidebar collapsed={false} hideToggle onNavItemClick={() => setMobileOpen(false)} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 mx-auto w-full max-w-4xl sm:max-w-6xl lg:max-w-7xl px-3 sm:px-6 py-4 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

