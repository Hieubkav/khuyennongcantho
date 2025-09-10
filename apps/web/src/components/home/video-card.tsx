import Image from "next/image";
import { Play } from "lucide-react";

export interface VideoItem {
  id?: string;
  title: string;
  thumbnail?: string;
  href?: string;
  duration?: string;
}

export function VideoCard({ video }: { video: VideoItem }) {
  return (
    <a href={video.href || "#"} className="group block transition-all duration-300 ease-in-out hover:scale-[1.02]">
      <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 ease-in-out hover:shadow-md">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={video.thumbnail || "/placeholder.svg"}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
            <span className="inline-flex items-center justify-center rounded-full bg-white/90 p-4 shadow-lg transition-all duration-300 group-hover:scale-110">
              <Play className="h-6 w-6 text-primary" />
            </span>
          </div>
          {video.duration ? (
            <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {video.duration}
            </span>
          ) : null}
        </div>
        <div className="p-4">
          <p className="text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {video.title}
          </p>
        </div>
      </div>
    </a>
  );
}

