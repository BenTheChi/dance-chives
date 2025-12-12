"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { Heart, Share2 } from "lucide-react";
import { TEventCard } from "@/types/event";
import { StyleBadge } from "@/components/ui/style-badge";
import { useToggleSave } from "@/hooks/use-toggle-save";
import { cn } from "@/lib/utils";

interface EventCardProps extends TEventCard {
  roles?: string[];
  href?: string; // Optional href for the title link, defaults to /events/${id}
  isSaved?: boolean;
}

export function EventCard({
  id,
  title,
  series,
  imageUrl,
  date,
  city,
  cityId,
  styles,
  roles,
  href,
  isSaved,
  additionalDatesCount,
  eventType,
}: EventCardProps) {
  const titleHref = href || `/events/${id}`;
  const {
    isSaved: savedState,
    toggle,
    isPending,
  } = useToggleSave(isSaved ?? false, id);
  const [shareCopied, setShareCopied] = useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const eventUrl = `${window.location.origin}${titleHref}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  // Show 1 style on mobile, 3 on desktop, then "+x more styles"
  const firstStyle = styles?.[0];
  const desktopStyles = styles?.slice(1, 3) || [];
  const mobileAdditionalCount =
    styles && styles.length > 1 ? styles.length - 1 : 0;
  const desktopAdditionalCount =
    styles && styles.length > 3 ? styles.length - 3 : 0;

  // Format date for display (MM/DD/YY format)
  const formattedDate = date
    ? (() => {
        try {
          const dateObj = new Date(date);
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const year = String(dateObj.getFullYear()).slice(-2);
          return `${month}/${day}/${year}`;
        } catch {
          return date; // Fallback to original if parsing fails
        }
      })()
    : "";

  return (
    <div className="group border border-black overflow-hidden rounded-[5px] bg-gray-100 transition-all duration-300 w-[250px] h-[350px] sm:w-[358px] sm:h-[358px] sm:relative">
      {/* Poster square - clickable */}
      <Link
        href={titleHref}
        className="block w-full h-[250px] sm:h-[358px] border-b border-black relative flex items-center justify-center bg-gray-200"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover sm:object-contain"
          />
        ) : (
          <h3 className="font-bold text-sm text-center px-4">{title}</h3>
        )}
      </Link>

      {/* Expanded section - always visible on mobile, fades in overlay on desktop hover */}
      <div className="w-full h-[100px] bg-gray-100 sm:absolute sm:inset-x-0 sm:bottom-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:pointer-events-none sm:group-hover:pointer-events-auto sm:h-[135px] sm:bg-gray-100/90 overflow-hidden flex flex-col justify-end z-10">
        <div className="px-3 pb-2 sm:px-6 sm:pb-1 flex flex-col gap-5 sm:gap-7">
          <div className="flex justify-between items-center">
            {/* Title */}
            <div className="flex flex-col">
              <h3 className="font-bold text-md sm:text-lg">{title}</h3>
              <span className="text-xs sm:text-md text-gray-500">
                {formattedDate}
              </span>
              {additionalDatesCount && additionalDatesCount > 0 && (
                <span className="text-xs sm:text-md text-gray-500">
                  +{additionalDatesCount} more dates
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              {eventType && (
                <span className="text-xs text-gray-500">{eventType}</span>
              )}
              {city && (
                <span className="text-xs text-gray-500">
                  {city}
                  {cityId ? `, US` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Style tags and action buttons - same line on mobile, separate on desktop */}
          <div className="flex items-center justify-between gap-2">
            {/* Style tags */}
            <div className="flex flex-wrap gap-1 items-center sm:flex-wrap sm:mb-2 max-w-[180px]">
              {/* First style - visible on both mobile and desktop */}
              {firstStyle && (
                <StyleBadge
                  key={firstStyle}
                  style={firstStyle}
                  asLink={false}
                />
              )}
              {/* Additional styles for desktop only */}
              {desktopStyles.map((style) => (
                <StyleBadge
                  key={style}
                  style={style}
                  asLink={false}
                  className="hidden sm:inline-block"
                />
              ))}
              {/* Additional count - different for mobile vs desktop */}
              {mobileAdditionalCount > 0 && (
                <span className="text-xs text-gray-500 sm:hidden">
                  +{mobileAdditionalCount} more
                </span>
              )}
              {desktopAdditionalCount > 0 && (
                <span className="hidden sm:inline text-xs text-gray-500">
                  +{desktopAdditionalCount} more
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 sm:justify-end">
              <button
                onClick={handleShareClick}
                className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
                aria-label="Share event"
                title={shareCopied ? "Copied!" : "Copy event URL"}
              >
                <Share2 className="h-3 w-3 text-white" />
              </button>
              <button
                onClick={handleHeartClick}
                disabled={isPending}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  savedState
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600",
                  isPending && "opacity-50 cursor-not-allowed"
                )}
                aria-label={savedState ? "Unsave event" : "Save event"}
              >
                <Heart
                  className={cn(
                    "h-3 w-3",
                    savedState ? "fill-white text-white" : "text-white"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
