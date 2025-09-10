import { Section } from "./section";
import type { Article } from "@/lib/khuyennong";

export async function Sidebar() {
  const prices = {
    sectionName: "Bản tin giá nông sản",
    articles: Array.from({ length: 5 }).map((_, i) => ({
      title: `Giá nông sản hôm nay ${i + 1}`,
      link: "",
      image: "/placeholder.svg",
      details: { date: "2024-09-01" },
    })) as Article[],
  };

  const events = {
    sectionName: "Thông báo & sự kiện",
    articles: Array.from({ length: 5 }).map((_, i) => ({
      title: `Sự kiện khuyến nông ${i + 1}`,
      link: "",
      image: "/placeholder.svg",
      details: { date: "2024-09-02" },
    })) as Article[],
  };

  return (
    <aside className="space-y-8">
      <Section title={prices.sectionName} items={prices.articles} variant="list" />
      <Section title={events.sectionName} items={events.articles} variant="list" />
    </aside>
  );
}
