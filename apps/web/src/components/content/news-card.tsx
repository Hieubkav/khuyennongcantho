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

interface NewsCardProps {
  post: Post;
}

export default function NewsCard({ post }: NewsCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {post.cover && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={post.cover.url} 
            alt={post.cover.title || post.title} 
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="mb-2 flex flex-wrap gap-2">
          {post.categories.map((cat) => (
            <span key={cat.id} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              {cat.name}
            </span>
          ))}
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          <Link href={`/post/${post.slug}` as any} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="mb-4 text-muted-foreground">{post.excerpt}</p>
        <div className="text-sm text-muted-foreground">
          {new Date(post.publishedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}