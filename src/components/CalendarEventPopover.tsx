"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarEvent, formatTimeToAMPM } from "@/lib/utils/calendar-utils";
import { StyleBadge } from "@/components/ui/style-badge";
import { EventDate } from "@/types/event";
import { EventShareSaveButtons } from "@/components/events/EventShareSaveButtons";

interface CalendarEventPopoverProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalendarEventPopover({
  event,
  open,
  onOpenChange,
}: CalendarEventPopoverProps) {
  const { resource } = event;
  const { originalData, poster, styles, dateEntry } = resource;
  const location = resource.location as string | undefined;
  const cityName = resource.cityName as string | undefined;

  // Format date and time display
  const getDateAndTime = () => {
    let dateStr = "";
    let timeStr = "";

    // For events and sessions with dateEntry (multiple dates), use dateEntry
    if (dateEntry as EventDate) {
      dateStr = (dateEntry as EventDate).date;
      const { startTime, endTime } = dateEntry as EventDate;
      if (startTime && endTime) {
        timeStr = `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(
          endTime
        )}`;
      } else if (startTime) {
        timeStr = formatTimeToAMPM(startTime);
      } else {
        timeStr = "All Day";
      }
    } else {
      // Fallback to originalData for backward compatibility
      dateStr = originalData.startDate || "";
      const startTime = originalData.startTime;
      const endTime = originalData.endTime;

      if (startTime && endTime) {
        timeStr = `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(
          endTime
        )}`;
      } else if (startTime) {
        timeStr = formatTimeToAMPM(startTime);
      } else {
        timeStr = "All Day";
      }
    }

    // Format date string (MM/DD/YYYY to a more readable format)
    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      try {
        // Handle MM/DD/YYYY format
        if (dateString.includes("/")) {
          const [month, day, year] = dateString.split("/");
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
          return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
        // Handle ISO format
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return dateString;
      }
    };

    const formattedDate = formatDate(dateStr);
    return { date: formattedDate, time: timeStr };
  };

  const { date, time } = getDateAndTime();

  // Get link URL - all events use the unified /events/ route
  const getLinkUrl = () => {
    return `/events/${originalData.id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-primary border">
        <DialogHeader>
          <DialogTitle className="!text-[22px] !font-extrabold text-center">
            {event.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Poster */}
          {poster?.url ? (
            <Link href={getLinkUrl()} onClick={() => onOpenChange(false)}>
              <div className="relative w-full aspect-square card">
                <Image
                  src={poster.url}
                  alt={poster.title || event.title}
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
          ) : (
            <Link
              href={getLinkUrl()}
              onClick={() => onOpenChange(false)}
              className="w-full aspect-square bg-gray-200 rounded-sm flex items-center justify-center text-gray-400"
            >
              No poster
            </Link>
          )}

          <div className="flex flex-col gap-4 items-center mt-4">
            <div className="flex flex-col items-center">
              {/* Date - Centered */}
              {date && <h2>{date}</h2>}
              {/* Time - Centered */}
              {time && <h3>{time}</h3>}
            </div>

            <div className="flex flex-row gap-5">
              {/* Location - Centered */}
              {location && <h3>{String(location)}</h3>}

              {/* City - Centered */}
              {cityName && <h3>{String(cityName)}</h3>}
            </div>
            {/* Dance style tags - Centered */}
            {styles && styles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {styles.map((style: string) => (
                  <StyleBadge key={style} style={style} asLink={false} />
                ))}
              </div>
            )}

            {/* Share and Save buttons - centered at bottom */}
            <EventShareSaveButtons
              eventId={originalData.id}
              initialSaved={false}
              variant="large"
              eventHref={getLinkUrl()}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
