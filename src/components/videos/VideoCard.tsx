"use client";

import Image from "next/image";
import Link from "next/link";
import { Video } from "@/types/video";
import { Play } from "lucide-react";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  extractYouTubeVideoId,
  normalizeYouTubeThumbnailUrl,
} from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  eventLink: string;
  eventTitle: string;
  sectionTitle?: string;
  bracketTitle?: string;
  onClick: () => void;
  styles?: string[];
  // Optional context for callers; not currently used by this component.
  currentUserId?: string;
}

export function VideoCard({
  video,
  eventLink,
  eventTitle,
  onClick,
  styles,
}: VideoCardProps) {
  // Parse youtube id from src and generate thumbnail URL
  const youtubeId = extractYouTubeVideoId(video.src);
  const thumbnailUrl = youtubeId
    ? normalizeYouTubeThumbnailUrl(
        `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      )
    : "/placeholder.svg";

  // Use provided styles or video styles
  const displayStyles = styles || video.styles || [];

  // Get tagged dancers
  const taggedDancers = video.taggedDancers || [];

  // Show 1 style on mobile, 3 on desktop, then "+x more styles"
  const firstStyle = displayStyles?.[0];
  const desktopStyles = displayStyles?.slice(1, 3) || [];
  const mobileAdditionalCount =
    displayStyles && displayStyles.length > 1 ? displayStyles.length - 1 : 0;
  const desktopAdditionalCount =
    displayStyles && displayStyles.length > 3 ? displayStyles.length - 3 : 0;

  return (
    <div className="group border border-black overflow-hidden rounded-[5px] bg-gray-100 transition-all duration-300 w-full min-w-[300px] relative">
      {/* Thumbnail - clickable */}
      <div
        className="w-full aspect-[4/3] border-b border-black relative z-5 flex items-center justify-center bg-gray-200 cursor-pointer"
        onClick={onClick}
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
          />
        ) : (
          <h3 className="font-bold text-sm text-center px-4">{video.title}</h3>
        )}
        <div
          className="absolute inset-0 bottom-30 bg-black/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center"
          onClick={onClick}
        >
          <div className="bg-red-600 rounded-full p-3 scale-100 sm:scale-90 sm:group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Expanded section - always visible on mobile, slides up on hover on desktop */}
      <div className="absolute border-t border-black inset-x-0 bottom-0 h-[150px] bg-gray-100/90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto overflow-hidden flex flex-col justify-end z-10">
        <div className="px-6 pb-3 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{video.title}</h3>

            {/* Title */}
            <div className="flex flex-col gap-1 items-end">
              <Link
                href={eventLink}
                className="text-sm text-gray-500 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                {eventTitle}
              </Link>
              <span className="text-xs text-gray-500 capitalize">
                {video.type}
              </span>
            </div>
          </div>

          {/* Style tags and dancer tags */}
          <div className="flex flex-col gap-2">
            {/* Dancer tags */}
            {taggedDancers.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                {taggedDancers.map((dancer) => (
                  <UserAvatar
                    key={dancer.id || dancer.username}
                    username={dancer.username}
                    displayName={dancer.displayName}
                    avatar={dancer.avatar}
                    image={dancer.image}
                  />
                ))}
              </div>
            )}

            {/* Style tags */}
            {displayStyles.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                {/* First style */}
                {firstStyle && (
                  <StyleBadge
                    key={firstStyle}
                    style={firstStyle}
                    asLink={false}
                  />
                )}
                {/* Additional styles */}
                {desktopStyles.map((style) => (
                  <StyleBadge key={style} style={style} asLink={false} />
                ))}
                {/* Additional count */}
                {desktopAdditionalCount > 0 && (
                  <span className="text-xs text-gray-500">
                    +{desktopAdditionalCount} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
