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
  const { originalData, poster, styles, eventType, dateEntry } = resource;

  // Format time display
  const formatTime = () => {
    // For events and sessions with dateEntry (multiple dates), use dateEntry
    if (dateEntry as EventDate) {
      const { startTime, endTime } = dateEntry as EventDate;
      if (startTime && endTime) {
        return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
      } else if (startTime) {
        return formatTimeToAMPM(startTime);
      }
      return "All Day";
    }

    // Fallback to originalData for backward compatibility
    const startTime = originalData.startTime;
    const endTime = originalData.endTime;

    if (startTime && endTime) {
      return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
    } else if (startTime) {
      return formatTimeToAMPM(startTime);
    }
    return "All Day";
  };

  // Get link URL - all events use the unified /events/ route
  const getLinkUrl = () => {
    return `/events/${originalData.id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Link
              href={getLinkUrl()}
              className="hover:underline"
              onClick={() => onOpenChange(false)}
            >
              {event.title}
            </Link>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Poster */}
          {poster?.url ? (
            <div className="relative w-full h-48 rounded-md overflow-hidden">
              <Image
                src={poster.url}
                alt={poster.title || event.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
              No poster
            </div>
          )}

          {/* Event Type */}
          {eventType && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Type:</span> {eventType}
            </div>
          )}

          {/* Title with link */}
          <div>
            <Link
              href={getLinkUrl()}
              className="text-base font-medium hover:underline"
              onClick={() => onOpenChange(false)}
            >
              View Details →
            </Link>
          </div>

          {/* Time */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Time:</span> {formatTime()}
          </div>

          {/* Dance style tags */}
          {styles && styles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {styles.map((style: string) => (
                <StyleBadge key={style} style={style} asLink={false} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
