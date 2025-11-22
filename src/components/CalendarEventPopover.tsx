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
  const { type, originalData, poster, styles } = resource;

  // Format time display
  const formatTime = () => {
    if (resource.type === "session" && resource.dateEntry) {
      const { startTime, endTime } = resource.dateEntry;
      if (startTime && endTime) {
        return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
      } else if (startTime) {
        return formatTimeToAMPM(startTime);
      }
      return "All Day";
    }

    const startTime = originalData.startTime;
    const endTime = originalData.endTime;

    if (startTime && endTime) {
      return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
    } else if (startTime) {
      return formatTimeToAMPM(startTime);
    }
    return "All Day";
  };

  // Get link URL based on type
  const getLinkUrl = () => {
    switch (type) {
      case "event":
        return `/competitions/${originalData.id}`;
      case "workshop":
        return `/workshops/${originalData.id}`;
      case "session":
        return `/sessions/${originalData.id}`;
      default:
        return "#";
    }
  };

  // Get parent event route based on parent event type
  const getParentEventRoute = (parentId?: string) => {
    if (!parentId) return "#";
    const parentEventType = resource.parentEventType;
    switch (parentEventType) {
      case "workshop":
        return `/workshops/${parentId}`;
      case "session":
        return `/sessions/${parentId}`;
      case "competition":
      default:
        return `/competitions/${parentId}`;
    }
  };

  // Get parent event link if applicable (for subevents)
  const getParentEventLink = () => {
    if (resource.parentEventId && resource.parentEventTitle) {
      return {
        id: resource.parentEventId,
        title: resource.parentEventTitle,
      };
    }
    return null;
  };

  const parentEvent = getParentEventLink();

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

          {/* Parent event link */}
          {parentEvent && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Main Event:</span>{" "}
              <Link
                href={getParentEventRoute(parentEvent.id)}
                className="text-blue-600 hover:underline"
                onClick={() => onOpenChange(false)}
              >
                {parentEvent.title}
              </Link>
            </div>
          )}

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
