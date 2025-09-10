import type { Article } from "@/lib/khuyennong";
import { NewsCard } from "./news-card";
import { Carousel } from "./carousel";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";

interface SectionProps {
  title: string;
  items: Article[];
  variant?: "grid" | "list" | "carousel";
  moreHref?: Route<string> | string;
  className?: string;
  children?: React.ReactNode;
}

export function Section({ title, items, variant = "grid", className, moreHref, children }: SectionProps) {
  const hasItems = items && items.length > 0;

  const renderItems = () => {
    if (!hasItems) {
      return <p className="text-muted-foreground">Không có bài viết nào.</p>;
    }

    switch (variant) {
      case "carousel":
        return (
          <Carousel>
            {items.map((item, index) => (
              <div
                key={item.link || item.slug || index}
                className="snap-start w-[80%] md:w-[40%] lg:w-[25%] flex-shrink-0"
              >
                <NewsCard article={item} priority={index < 2} />
              </div>
            ))}
          </Carousel>
        );
      case "list":
        return (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={item.link || item.slug || index}>
                <div className="group flex items-start gap-3">
                  <span className="text-muted-foreground text-sm pt-1">-</span>
                  <p className="font-medium leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        );
      case "grid":
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <NewsCard
                key={item.link || item.slug || index}
                article={item}
                priority={index < 3}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <section className={cn("py-12", className)}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-primary">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref as Route<string>}
            className="text-base font-semibold text-primary hover:underline transition-colors"
          >
            Xem tất cả →
          </Link>
        )}
      </div>
      {children ? children : renderItems()}
    </section>
  );
}
