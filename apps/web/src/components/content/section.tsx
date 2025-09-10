import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Section({ id, title, description, action, children, className }: SectionProps) {
  return (
    <section id={id} className={cn("mb-12 scroll-mt-24", className)}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}
