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
    <div className="group card rounded-sm transition-all duration-300 w-full min-w-[300px] relative overflow-visible">
      {/* Thumbnail - clickable */}
      <div
        className="w-full aspect-[4/3] rounded-sm relative z-5 flex items-center justify-center bg-gray-200 cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover mt-5 sm:mt-0"
          />
        ) : (
          <h3 className="font-bold text-sm text-center px-4">{video.title}</h3>
        )}
      </div>

      {/* Expanded section - always visible on mobile, slides up on hover on desktop */}
      <div className="absolute inset-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto z-10 flex flex-col overflow-visible">
        <div className="flex flex-col items-baseline bg-neutral-500 px-3 py-2 border-b border-black">
          <h3 className="!text-[14px]">{video.title}</h3>

          {/* Title */}
          <div className="flex gap-1 items-end justify-between w-full">
            <Link
              href={eventLink}
              className="text-sm text-white hover:text-primary-light text-end underline"
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
        <div className="flex flex-col gap-2 pt-2 px-2">
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
        {/* Play button - absolutely centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="bg-mint/85 hover:bg-mint/95 rounded-full p-3 scale-100 sm:scale-90 sm:group-hover:scale-100 transition-transform cursor-pointer pointer-events-auto border-2 border-pulse-green mt-8"
            onClick={onClick}
          >
            <Play className="w-6 h-6 text-pulse-green fill-pulse-green ml-0.5 size-6" />
          </div>
        </div>
        {/* Dancer tags */}
        {taggedDancers.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center px-2 pb-2 mt-auto">
            {taggedDancers.map((dancer) => (
              <UserAvatar
                key={dancer.id || dancer.username}
                username={dancer.username}
                displayName={dancer.displayName}
                avatar={dancer.avatar}
                image={dancer.image}
                showHoverCard
                city={dancer.city || ""}
                styles={dancer.styles}
                borderColor="white"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
