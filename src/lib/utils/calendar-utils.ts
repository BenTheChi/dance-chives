import { parse, isValid, addHours, addDays } from "date-fns";
import { CalendarEventData } from "@/db/queries/event";
import { EventType, EventDate } from "@/types/event";

/**
 * Convert 24-hour time string (HH:mm) to 12-hour AM/PM format
 * @param timeStr - Time string in HH:mm format (e.g., "14:30" or "09:00")
 * @returns Time string in 12-hour AM/PM format (e.g., "2:30 PM" or "9:00 AM")
 */
export function formatTimeToAMPM(timeStr: string | null | undefined): string {
  if (!timeStr) return "";

  try {
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, "0");

    return `${displayHours}:${displayMinutes} ${period}`;
  } catch {
    return timeStr;
  }
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    eventType?: EventType; // The event type from the data (optional)
    originalData: CalendarEventData;
    dateEntry?: EventDate; // The specific date entry for multi-date events
    poster?: {
      id: string;
      title: string;
      url: string;
      type: string;
    } | null;
    styles?: string[];
    [key: string]: unknown;
  };
}

/**
 * Parse date string (supports MM/DD/YYYY and ISO formats) and HH:mm time string into a Date object
 * @param dateStr - Date string in MM/DD/YYYY or ISO format (e.g., "12/25/2024" or "2024-12-25")
 * @param timeStr - Time string in HH:mm format (24-hour, e.g., "14:30")
 * @returns Date object with parsed date and time
 */
function parseDateTime(
  dateStr: string | null | undefined,
  timeStr?: string | null | undefined
): Date {
  // Handle null/undefined date strings
  if (!dateStr) {
    // Return current date as fallback
    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    return fallbackDate;
  }

  let date: Date;

  // Try to parse as ISO format first (YYYY-MM-DD or full ISO string)
  if (dateStr.includes("-")) {
    const isoDate = new Date(dateStr);
    if (isValid(isoDate)) {
      date = isoDate;
    } else {
      // Try parsing just the date part (YYYY-MM-DD)
      const dateOnly = dateStr.split("T")[0].split(" ")[0];
      const parsed = parse(dateOnly, "yyyy-MM-dd", new Date());
      date = isValid(parsed) ? parsed : new Date();
    }
  } else {
    // Try parsing as MM/DD/YYYY format
    const parsed = parse(dateStr, "MM/dd/yyyy", new Date());
    date = isValid(parsed) ? parsed : new Date(dateStr);
  }

  // Validate the parsed date
  if (!isValid(date)) {
    // If all parsing fails, use current date as fallback
    date = new Date();
  }

  // Parse and set time if provided
  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      date.setHours(hours, minutes, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
  } else {
    // Default to start of day if no time provided
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

/**
 * Convert Event to calendar events (returns array since events can have multiple dates)
 * Uses the generic event structure with eventType and dates array
 */
export function convertEventToCalendarEvents(
  event: CalendarEventData
): CalendarEvent[] {
  // Primary path: use dates array if available
  if (event.dates && event.dates.length > 0) {
    return event.dates.map((dateEntry, index) => {
      const start = parseDateTime(dateEntry.date, dateEntry.startTime);
      let end = dateEntry.endTime
        ? parseDateTime(dateEntry.date, dateEntry.endTime)
        : dateEntry.startTime
          ? addHours(start, 1)
          : parseDateTime(dateEntry.date, "23:59");
      // If end is before start (overnight), extend into the next day
      if (end <= start && dateEntry.endTime) {
        end = addDays(end, 1);
      }

      return {
        id: `${event.id}-${index}`,
        title: event.title,
        start,
        end,
        resource: {
          eventType: event.eventType, // Use eventType if available
          originalData: event,
          dateEntry: dateEntry, // Store the specific date entry for reference
          poster: event.poster,
          styles: event.styles,
          location: event.location,
          cityName: event.cityName,
        },
      };
    });
  }

  // Fallback: use startDate for backward compatibility (single date events)
  if (event.startDate) {
    const start = parseDateTime(event.startDate, event.startTime);
    let end = event.endTime
      ? parseDateTime(event.startDate, event.endTime)
      : event.startTime
        ? addHours(start, 1)
        : parseDateTime(event.startDate, "23:59");
    // If end is before start (overnight), extend into the next day
    if (end <= start && event.endTime) {
      end = addDays(end, 1);
    }

    return [
      {
        id: event.id,
        title: event.title,
        start,
        end,
        resource: {
          eventType: event.eventType, // Use eventType if available
          originalData: event,
          poster: event.poster,
          styles: event.styles,
          location: event.location,
          cityName: event.cityName,
        },
      },
    ];
  }

  // If no dates available, return empty array
  console.warn(`Event ${event.id} has no dates available`);
  return [];
}

/**
 * Convert Event to calendar event format (single event - kept for backward compatibility)
 * @deprecated Use convertEventToCalendarEvents instead, which handles multi-date events properly
 */
export function convertEventToCalendarEvent(
  event: CalendarEventData
): CalendarEvent {
  const events = convertEventToCalendarEvents(event);
  if (events.length === 0) {
    // Return a fallback event if no dates are available
    return {
      id: event.id,
      title: event.title,
      start: new Date(),
      end: new Date(),
      resource: {
        eventType: event.eventType, // Use eventType if available
        originalData: event,
        poster: event.poster,
        styles: event.styles,
        location: event.location,
        cityName: event.cityName,
      },
    };
  }
  return events[0];
}
