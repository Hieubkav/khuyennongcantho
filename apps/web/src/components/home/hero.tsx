"use client";

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import type { Article } from '@/lib/khuyennong';
import { useDebounce } from '@/lib/hooks/use-debounce';
// Tạm thời không dùng liên kết để tránh điều hướng
import { Search } from 'lucide-react';

interface HeroProps {
  title: string;
  description: string;
  searchData: Article[];
}

export function Hero({ title, description, searchData }: HeroProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const debouncedQuery = useDebounce(query, 250);

  const allArticles = useMemo(() => searchData, [searchData]);

  useEffect(() => {
    if (debouncedQuery.length > 1) {
      const filtered = allArticles
        .filter((article) => {
          const q = debouncedQuery.toLowerCase();
          const titleMatch = article.title.toLowerCase().includes(q);
          const contentMatch = article.details?.content?.toLowerCase().includes(q) || false;
          return titleMatch || contentMatch;
        })
        .slice(0, 5);
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, allArticles]);

  return (
    <div 
      className="relative text-center py-20 md:py-28 border-b bg-card overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, oklch(0.5 0.15 150 / 0.1) 1px, transparent 0)
        `,
        backgroundSize: '0.5rem 0.5rem',
      }}
    >
      <div className="container z-10 relative">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-primary">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          {description}
        </p>
        <div className="mt-10 max-w-lg mx-auto relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm tin tức, kỹ thuật..."
              className="w-full pl-12 pr-4 py-3 h-14 rounded-full text-base bg-background border-2 border-primary/20 focus:border-primary focus:ring-primary/20"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-10 text-left">
              <ul className="py-2">
                {results.map((article, index) => (
                  <li key={index} className="px-4 py-2 hover:bg-muted cursor-default">
                    <p className="font-semibold truncate">{article.title}</p>
                    {article.details?.content && (
                      <p className="text-sm text-muted-foreground truncate">
                        {article.details.content}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
