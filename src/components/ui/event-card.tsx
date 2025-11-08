"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "@/types/event";
import { Play } from "lucide-react";
import { StyleBadge } from "@/components/ui/style-badge";

interface EventCardProps {
  video: Video;
  eventLink: string;
  eventTitle: string;
  onClick: () => void;
  roles?: string[]; // Kept for API compatibility but not displayed
}

export function EventCard({
  video,
  eventLink,
  eventTitle,
  onClick,
  roles,
}: EventCardProps) {
  //Parse youtube id from src
  const youtubeId = video.src.split("v=")[1]?.split("&")[0];
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02">
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <Image
            src={thumbnailUrl || "/placeholder.svg"}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            onClick={onClick}
          />
          <div
            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
            onClick={onClick}
          >
            <div className="bg-red-600 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-200">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>

        <div className="sm:p-4 space-y-2 sm:space-y-3">
          <h3
            className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={onClick}
          >
            {video.title}
          </h3>

          <Link href={eventLink} className="text-sm text-muted-foreground">
            {eventTitle}
          </Link>

          {/* Display video styles */}
          {video.styles && video.styles.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {video.styles.map((style) => (
                <StyleBadge key={style} style={style} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
