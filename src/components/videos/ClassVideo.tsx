"use client";

import Image from "next/image";
import Link from "next/link";
import { CardWithPoster, CardContent } from "@/components/ui/card";
import { ClassVideo as ClassVideoType } from "@/types/video";
import { Play } from "lucide-react";
import { StyleBadge } from "@/components/ui/style-badge";
import {
  extractYouTubeVideoId,
  normalizeYouTubeThumbnailUrl,
} from "@/lib/utils";

interface ClassVideoProps {
  video: ClassVideoType;
  eventLink: string;
  eventTitle: string;
  sectionTitle?: string;
  bracketTitle?: string;
  onClick: () => void;
  styles?: string[];
  currentUserId?: string;
}

export function ClassVideo({
  video,
  eventLink,
  eventTitle,
  sectionTitle,
  bracketTitle,
  onClick,
  styles,
}: ClassVideoProps) {
  // Parse youtube id from src and generate thumbnail URL
  const youtubeId = extractYouTubeVideoId(video.src);
  const thumbnailUrl = youtubeId
    ? normalizeYouTubeThumbnailUrl(
        `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      )
    : "/placeholder.svg";

  // Use provided styles or video styles
  const displayStyles = styles || video.styles || [];

  return (
    <CardWithPoster className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 border-purple-500">
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
          </div>

          <Link
            href={eventLink}
            className="text-sm text-muted-foreground hover:text-blue-600"
          >
            {eventTitle}
          </Link>

          {sectionTitle && (
            <div className="text-xs text-muted-foreground">
              Section: {sectionTitle}
            </div>
          )}

          {bracketTitle && (
            <div className="text-xs text-muted-foreground">
              Bracket: {bracketTitle}
            </div>
          )}

          {/* Display video styles */}
          {displayStyles.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {displayStyles.map((style) => (
                <StyleBadge key={style} style={style} asLink={false} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </CardWithPoster>
  );
}
