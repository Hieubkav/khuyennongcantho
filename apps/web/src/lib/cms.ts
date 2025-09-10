// src/lib/cms.ts
// Mock data adapters - sẽ được thay bằng API calls thực tế

import type { Category, Media, Post, DocumentFile, HomeFeed } from "@/app/(site)/page";

// Mock data generators
function generateMockPost(id: string, title: string, category: Category): Post {
  return {
    id,
    slug: `post-${id}`,
    title,
    excerpt: `Đây là tóm tắt nội dung của bài viết "${title}"...`,
    cover: {
      id: `media-${id}`,
      type: "image",
      url: `https://picsum.photos/seed/${id}/800/450`,
      title: `Ảnh minh họa cho ${title}`,
    },
    categories: [category],
    publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function generateMockVideo(id: string, title: string): Media {
  return {
    id: `video-${id}`,
    type: "video",
    url: "#",
    title,
    thumb: `https://picsum.photos/seed/video${id}/800/450`,
    durationSec: Math.floor(Math.random() * 300) + 60,
  };
}

function generateMockDocument(id: string, title: string): DocumentFile {
  const types: DocumentFile["type"][] = ["pdf", "docx", "pptx", "xls", "zip"];
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    id: `doc-${id}`,
    title,
    fileUrl: "#",
    type,
    sizeKb: Math.floor(Math.random() * 5000) + 100,
  };
}

// Data adapters
export async function getHomeFeed(): Promise<HomeFeed> {
  // Mock categories
  const categories: Category[] = [
    { id: "1", slug: "tin-nganh-nong-nghiep", name: "Tin ngành" },
    { id: "2", slug: "hoat-dong-khuyen-nong", name: "Hoạt động" },
    { id: "3", slug: "mo-hinh-khuyen-nong", name: "Mô hình" },
    { id: "4", slug: "khoa-hoc-ky-thuat", name: "KHKT" },
    { id: "5", slug: "pho-bien-chinh-sach", name: "Chính sách" },
  ];

  // Generate mock data
  const featuredMain = generateMockPost("featured", "Bài viết nổi bật trên trang chủ", categories[0]);
  const featuredSecondary = Array.from({ length: 3 }, (_, i) => 
    generateMockPost(`featured-${i}`, `Bài viết phụ ${i + 1}`, categories[1])
  );
  
  const latest = Array.from({ length: 6 }, (_, i) => 
    generateMockPost(`latest-${i}`, `Tin mới ${i + 1}`, categories[i % categories.length])
  );
  
  const videos = Array.from({ length: 6 }, (_, i) => 
    generateMockVideo(`${i}`, `Video khuyến nông ${i + 1}`)
  );
  
  const documents = Array.from({ length: 8 }, (_, i) => 
    generateMockDocument(`${i}`, `Tài liệu ${i + 1}`)
  );

  return {
    featured: {
      main: featuredMain,
      secondary: featuredSecondary,
    },
    latest,
    videos,
    documents,
  };
}

export async function getPostsByCategory(slug: string, limit: number = 6): Promise<Post[]> {
  // Find category by slug
  const categories: Category[] = [
    { id: "1", slug: "tin-nganh-nong-nghiep", name: "Tin ngành" },
    { id: "2", slug: "hoat-dong-khuyen-nong", name: "Hoạt động" },
    { id: "3", slug: "mo-hinh-khuyen-nong", name: "Mô hình" },
    { id: "4", slug: "khoa-hoc-ky-thuat", name: "KHKT" },
    { id: "5", slug: "pho-bien-chinh-sach", name: "Chính sách" },
  ];
  
  const category = categories.find(c => c.slug === slug);
  if (!category) return [];

  // Generate mock posts for category
  return Array.from({ length: limit }, (_, i) => 
    generateMockPost(`${slug}-${i}`, `Bài viết ${i + 1} trong ${category.name}`, category)
  );
}
