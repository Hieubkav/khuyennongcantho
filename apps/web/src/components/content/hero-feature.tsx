import React from "react";
import Link from "next/link";

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface Media {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  thumb?: string;
  durationSec?: number;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover?: Media;
  categories: Category[];
  publishedAt: string;
}

interface HeroFeatureProps {
  main: Post;
  secondary: Post[];
}

export function HeroFeature({ main, secondary }: HeroFeatureProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Main featured post */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {main.cover && (
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={main.cover.url} 
              alt={main.cover.title || main.title} 
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <div className="mb-2 flex flex-wrap gap-2">
            {main.categories.map((cat) => (
              <span key={cat.id} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                {cat.name}
              </span>
            ))}
          </div>
          <h3 className="mb-2 text-xl font-bold">
            <Link href={`/post/${main.slug}` as any} className="hover:underline">
              {main.title}
            </Link>
          </h3>
          <p className="text-muted-foreground">{main.excerpt}</p>
          <div className="mt-4 text-sm text-muted-foreground">
            {new Date(main.publishedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Secondary posts */}
      <div className="space-y-4">
        {secondary.map((post) => (
          <div key={post.id} className="flex gap-4 rounded-lg border p-4">
            {post.cover && (
              <div className="aspect-video w-1/3 overflow-hidden rounded">
                <img 
                  src={post.cover.url} 
                  alt={post.cover.title || post.title} 
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-semibold">
                <Link href={`/post/${post.slug}` as any} className="hover:underline">
                  {post.title}
                </Link>
              </h4>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}