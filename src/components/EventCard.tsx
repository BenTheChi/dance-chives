"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";
import { TEventCard } from "@/types/event";
import { StyleBadge } from "@/components/ui/style-badge";
import { EventShareSaveButtons } from "@/components/events/EventShareSaveButtons";

interface EventCardProps extends TEventCard {
  href?: string; // Optional href for the title link, defaults to /events/${id}
  isSaved?: boolean;
}

export function EventCard({
  id,
  title,
  imageUrl,
  date,
  city,
  cityId,
  styles,
  href,
  isSaved,
  additionalDatesCount,
  eventType,
}: EventCardProps) {
  const titleHref = href || `/events/${id}`;

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
    <div className="bg-misty-seafoam group card overflow-hidden transition-all duration-300 w-[330px] h-[466px] sm:w-[355px] sm:h-[354px] sm:relative">
      {/* Poster square - clickable */}
      <Link
        href={titleHref}
        className="block w-full h-[330px] sm:h-[357px] relative flex items-center justify-center bg-gray-200"
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover" />
        ) : (
          <h3 className="font-bold text-sm text-center px-4">{title}</h3>
        )}
      </Link>

      {/* Expanded section - always visible on mobile, fades in overlay on desktop hover */}
      <div className="w-full bg-misty-seafoam sm:absolute sm:inset-x-0 sm:bottom-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:pointer-events-none sm:group-hover:pointer-events-auto overflow-hidden flex flex-col justify-end z-10 border-t border-black py-[5px] sm:py-[7px]">
        <div className="pt-4 sm:pt-3 px-5 sm:px-6 sm:pb-2 flex flex-col gap-5 sm:gap-7">
          <div className="flex justify-between items-center">
            {/* Title */}
            <div className="flex flex-col">
              <h2 className="!text-[18px] sm:!text-[20px] line-clamp-2">
                {title}
              </h2>
              <span className="!text-[12px] sm:!text-md text-gray-500">
                {formattedDate}
              </span>
              {additionalDatesCount && additionalDatesCount > 0 && (
                <span className="!text-[12px] sm:!text-md text-gray-500">
                  +{additionalDatesCount} more dates
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              {eventType && (
                <span className="!text-[12px] text-gray-500">{eventType}</span>
              )}
              {city && (
                <span className="!text-[12px] text-gray-500">{city}</span>
              )}
            </div>
          </div>

          {/* Style tags and action buttons */}
          <div className="flex items-center justify-between gap-2 mb-2">
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
              <EventShareSaveButtons
                eventId={id}
                initialSaved={isSaved ?? false}
                variant="small"
                eventHref={titleHref}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
