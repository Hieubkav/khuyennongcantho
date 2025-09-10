import Image from "next/image";
import type { Article } from "@/lib/khuyennong";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  article: Article;
  className?: string;
  priority?: boolean;
}

export function NewsCard({ article, className, priority = false }: NewsCardProps) {
  const { title, link, image, details } = article;
  const date = details?.date;

  return (
    <a href={link} className="block group">
      <Card className={cn("overflow-hidden h-full flex flex-col rounded-xl border shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1", className)}>
        <CardHeader className="p-0 border-b">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-xl">
            <Image
              src={image || "/placeholder.svg"}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority={priority}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-base font-bold leading-snug group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </CardContent>
        {date && (
          <CardFooter className="p-4 pt-0">
            <p className="text-sm text-muted-foreground">{date}</p>
          </CardFooter>
        )}
      </Card>
    </a>
  );
}
