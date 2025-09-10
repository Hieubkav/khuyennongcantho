import Image from "next/image";
import type { Article } from "@/lib/khuyennong";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface FeaturedSectionProps {
  title: string;
  items: Article[];
  className?: string;
}

function MainArticleCard({ article, priority }: { article: Article; priority: boolean }) {
  return (
    <div className="block group relative overflow-hidden rounded-xl">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 p-6 md:p-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight group-hover:text-primary-foreground/80 transition-colors">
          {article.title}
        </h3>
      </div>
    </div>
  );
}

function SecondaryArticleCard({ article }: { article: Article }) {
  return (
    <div className="block group">
      <Card className="overflow-hidden h-full flex flex-col rounded-lg border shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1 bg-card">
        <CardHeader className="p-0">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={article.image || "/placeholder.svg"}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </CardHeader>
        <CardContent className="p-3 flex-grow">
          <p className="text-sm font-semibold leading-snug group-hover:text-primary">
            {article.title}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function FeaturedSection({ title, items, className }: FeaturedSectionProps) {
  if (!items || items.length === 0) {
    return <p className="text-muted-foreground">Không có bài viết nổi bật.</p>;
  }

  const mainArticle = items[0];
  const secondaryArticles = items.slice(1, 5);

  return (
    <section className={cn("py-10", className)}>
      <div className="flex items-center justify-between mb-6 border-b-2 border-primary pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-primary">{title}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <MainArticleCard article={mainArticle} priority={true} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          {secondaryArticles.map((item, index) => (
            <SecondaryArticleCard key={item.link || item.slug || index} article={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
