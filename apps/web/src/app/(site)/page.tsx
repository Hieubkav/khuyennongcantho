// src/app/(news)/page.tsx
import Link from "next/link";

// UI sections & cards (sẽ tạo sau theo spec)
import { Section } from "@/components/content/section";
import { HeroFeature } from "@/components/content/hero-feature";
import NewsCard from "@/components/content/news-card";
import VideoCard from "@/components/content/video-card";
import DocumentRow from "@/components/content/document-row";
import { Button } from "@/components/ui/button";

// Data adapters (sẽ triển khai trong lib/cms.ts)
import { getHomeFeed, getPostsByCategory } from "@/lib/cms";

// Revalidate trang chủ 5 phút/lần (ISR)
export const revalidate = 300;

/** ====== Kiểu dữ liệu nhẹ để file tự đứng được nếu chưa tạo lib/types ====== */
export type Category = { id: string; slug: string; name: string };
export type Media = { id: string; type: "image" | "video"; url: string; title?: string; thumb?: string; durationSec?: number };
export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover?: Media;
  categories: Category[];
  publishedAt: string;
};
export type DocumentFile = { id: string; title: string; fileUrl: string; type: "pdf" | "docx" | "pptx" | "xls" | "zip"; sizeKb?: number };

export type HomeFeed = {
  featured?: { main?: Post; secondary?: Post[] };
  latest: Post[];
  videos: Media[]; // type: "video"
  documents: DocumentFile[];
};

/** ====== Cấu hình các block danh mục cần show trên trang chủ ======
 *  Giữ "cái hồn" site cũ: Tin ngành, Hoạt động, Mô hình, KHKT, Chính sách...
 *  Bạn chỉ cần đảm bảo WP/Headless CMS có slug tương ứng.
 */
const CATEGORY_SECTIONS: { title: string; slug: string }[] = [
  { title: "Tin ngành nông nghiệp & PTNT", slug: "tin-nganh-nong-nghiep" },
  { title: "Hoạt động khuyến nông", slug: "hoat-dong-khuyen-nong" },
  { title: "Mô hình khuyến nông", slug: "mo-hinh-khuyen-nong" },
  { title: "Khoa học kỹ thuật", slug: "khoa-hoc-ky-thuat" },
  { title: "Phổ biến chính sách", slug: "pho-bien-chinh-sach" },
];

/** ====== Trang chủ ====== */
export default async function NewsHomePage() {
  // Lấy feed tổng hợp (hero, tin mới, video, tài liệu)
  const home: HomeFeed = await safeGetHomeFeed();

  // Lấy tin theo từng chuyên mục để render thành các Section riêng
  const categoryData = await Promise.all(
    CATEGORY_SECTIONS.map(async (c) => {
      const posts = await safeGetPostsByCategory(c.slug, 6); // 6 bài/mục
      return { ...c, posts };
    })
  );

  return (
    <>
      {/* --- Hero: Tin nổi bật (nếu có) --- */}
      {home.featured?.main && (
        <div className="mb-10">
          <HeroFeature main={home.featured.main} secondary={home.featured.secondary ?? []} />
        </div>
      )}

      {/* --- Tin mới --- */}
      {!!home.latest?.length && (
        <Section title="Tin mới" id="latest" action={<LinkAction href="/">{/* có thể đổi sang /news */}Xem tất cả</LinkAction>}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {home.latest.map((p) => (
              <NewsCard key={p.id} post={p} />
            ))}
          </div>
        </Section>
      )}

      {/* --- Các block theo chuyên mục cốt lõi (giống site cũ) --- */}
      {categoryData.map((cat) =>
        cat.posts.length ? (
          <Section
            key={cat.slug}
            id={cat.slug}
            title={cat.title}
            action={<LinkAction href={`/category/${cat.slug}`}>Xem tất cả</LinkAction>}
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cat.posts.map((p) => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          </Section>
        ) : null
      )}

      {/* --- Video khuyến nông --- */}
      {!!home.videos?.length && (
        <Section title="Video khuyến nông" id="videos" action={<LinkAction href="/videos">Xem tất cả</LinkAction>}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {home.videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </Section>
      )}

      {/* --- Tài liệu / Văn bản / Biểu mẫu --- */}
      {!!home.documents?.length && (
        <Section title="Tài liệu / Văn bản" id="documents" action={<LinkAction href="/documents">Xem tất cả</LinkAction>}>
          <div className="divide-y rounded-xl border bg-card">
            {home.documents.slice(0, 10).map((d) => (
              <DocumentRow key={d.id} doc={d} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

/** ====== Helpers ====== */
import type { Route } from 'next';
import type { UrlObject } from 'url';

function LinkAction({ href, children }: { href: Route<string> | UrlObject | string; children: React.ReactNode }) {
  return (
    <Button asChild variant="outline" className="rounded-full">
      <Link href={href as any}>{children}</Link>
    </Button>
  );
}

async function safeGetHomeFeed(): Promise<HomeFeed> {
  try {
    const res = await getHomeFeed(); // bạn hiện thực trong lib/cms.ts
    return {
      featured: res.featured ?? undefined,
      latest: res.latest ?? [],
      videos: res.videos ?? [],
      documents: res.documents ?? [],
    };
  } catch {
    // Fallback rỗng để trang vẫn build được
    return { latest: [], videos: [], documents: [] };
  }
}

async function safeGetPostsByCategory(slug: string, limit = 6): Promise<Post[]> {
  try {
    const posts = await getPostsByCategory(slug, limit); // hiện thực trong lib/cms.ts
    return posts ?? [];
  } catch {
    return [];
  }
}
