import Image from "next/image";
import type { Article } from "@/lib/khuyennong";

interface HeroFeatureProps {
  main: Article;
  secondary: Article[]; // expect 2-4 items
}

export function HeroFeature({ main, secondary }: HeroFeatureProps) {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-3">
        <a
          className="group relative overflow-hidden rounded-2xl lg:col-span-2 block transition-all duration-300 ease-in-out hover:scale-[1.02]"
          href={main.link || "#"}
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={main.image || "/placeholder.svg"}
              alt={main.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-white drop-shadow-lg">
              {main.title}
            </h2>
          </div>
        </a>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {secondary.slice(0, 4).map((item, idx) => (
            <a
              key={item.link || item.slug || idx}
              className="group relative overflow-hidden rounded-xl block border bg-card transition-all duration-300 ease-in-out hover:scale-[1.03]"
              href={item.link || "#"}
            >
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-base font-bold text-white line-clamp-2 drop-shadow-md">
                  {item.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
