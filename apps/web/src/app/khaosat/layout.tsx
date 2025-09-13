import { KhaosatHeader, KhaosatFooter } from "@/components/khaosat-header";

export default function KhaosatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <KhaosatHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-4">
          {children}
        </div>
      </main>
      <KhaosatFooter />
    </div>
  );
}

