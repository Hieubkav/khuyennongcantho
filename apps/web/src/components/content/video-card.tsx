import React from "react";

interface Media {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  thumb?: string;
  durationSec?: number;
}

interface VideoCardProps {
  video: Media;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {video.thumb && (
        <div className="aspect-video w-full overflow-hidden relative">
          <img 
            src={video.thumb} 
            alt={video.title} 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="rounded-full bg-primary/80 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold">{video.title}</h3>
        {video.durationSec && (
          <div className="mt-2 text-sm text-muted-foreground">
            {Math.floor(video.durationSec / 60)}:{String(video.durationSec % 60).padStart(2, '0')}
          </div>
        )}
      </div>
    </div>
  );
}