"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "@/types/event";
import { Play } from "lucide-react";
import { StyleBadge } from "@/components/ui/style-badge";
import {
  extractYouTubeVideoId,
  normalizeYouTubeThumbnailUrl,
} from "@/lib/utils";

interface EventCardProps {
  video: Video;
  eventLink: string;
  eventTitle: string;
  onClick: () => void;
  roles?: string[]; // Kept for API compatibility but not displayed
  isWinner?: boolean;
}

export function EventCard({
  video,
  eventLink,
  eventTitle,
  onClick,
  roles,
  isWinner = false,
}: EventCardProps) {
  // Parse youtube id from src and generate thumbnail URL
  const youtubeId = extractYouTubeVideoId(video.src);
  const thumbnailUrl = youtubeId
    ? normalizeYouTubeThumbnailUrl(
        `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      )
    : "/placeholder.svg";

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
        isWinner ? "border-2 border-yellow-400 shadow-md" : ""
      }`}
    >
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
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-semibold text-base sm:text-lg line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors flex-1"
              onClick={onClick}
            >
              {video.title}
            </h3>
            {isWinner && (
              <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded whitespace-nowrap">
                🏆 Winner
              </span>
            )}
          </div>

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
