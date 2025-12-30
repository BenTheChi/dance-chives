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
    <div className="relative bg-primary-dark group card overflow-hidden transition-all duration-300 w-full flex flex-col">
      {/* Poster square - clickable */}
      <Link
        href={titleHref}
        className="block relative w-full aspect-square bg-neutral-400"
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Top half - mascot image */}
            <div className="flex-3 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src="/mascot/Dancechives_Mascot1_Mono_onLight_slim.png"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            {/* Bottom half - event title */}
            <div className="flex-1 flex items-start justify-center">
              <h2 className="text-center px-4 text-black">{title}</h2>
            </div>
          </div>
        )}
      </Link>

      {/* Expanded section - always visible on mobile, fades in overlay on desktop hover */}
      <div className="w-full bg-primary-dark sm:absolute sm:inset-x-0 sm:bottom-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:pointer-events-none sm:group-hover:pointer-events-auto overflow-hidden flex flex-col justify-end z-10 border-t-4 border-primary-light py-[5px] sm:py-[7px]">
        <div className="pt-4 sm:pt-3 px-5 sm:px-6 sm:pb-2 flex flex-col gap-5 sm:gap-7">
          <div className="flex justify-between items-center">
            {/* Title */}
            <div className="flex flex-col">
              <h2 className="!text-[18px] sm:!text-[20px] line-clamp-2">
                {title}
              </h2>
              <span className="!text-[12px] sm:!text-md ">{formattedDate}</span>
              {additionalDatesCount && additionalDatesCount > 0 && (
                <span className="!text-[12px] sm:!text-md ">
                  +{additionalDatesCount} more dates
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              {eventType && <span className="!text-[12px] ">{eventType}</span>}
              {city && <span className="!text-[12px] ">{city}</span>}
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
                <span className="text-xs  sm:hidden">
                  +{mobileAdditionalCount} more
                </span>
              )}
              {desktopAdditionalCount > 0 && (
                <span className="hidden sm:inline text-xs ">
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
