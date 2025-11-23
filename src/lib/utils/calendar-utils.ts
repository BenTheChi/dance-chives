import { parse } from "date-fns";
import {
  CalendarEventData,
  CalendarWorkshopData,
  CalendarSessionData,
} from "@/db/queries/event";

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
    type: "event" | "workshop" | "session";
    originalData: any;
    [key: string]: any;
  };
}

/**
 * Parse MM/DD/YYYY date string and HH:mm time string into a Date object
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

  // Parse date in MM/DD/YYYY format
  const date = parse(dateStr, "MM/dd/yyyy", new Date());

  if (timeStr) {
    // Parse time in HH:mm format (24-hour)
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
 * Convert Event to calendar event format
 */
export function convertEventToCalendarEvent(
  event: CalendarEventData
): CalendarEvent {
  const start = parseDateTime(event.startDate, event.startTime);
  const end = event.endTime
    ? parseDateTime(event.startDate, event.endTime)
    : parseDateTime(event.startDate, "23:59"); // Default to end of day if no end time

  return {
    id: event.id,
    title: event.title,
    start,
    end,
    resource: {
      type: "event",
      originalData: event,
      poster: event.poster,
      styles: event.styles,
    },
  };
}

/**
 * Convert Workshop to calendar event format
 */
export function convertWorkshopToCalendarEvent(
  workshop: CalendarWorkshopData
): CalendarEvent {
  const start = parseDateTime(workshop.startDate, workshop.startTime);
  const end = workshop.endTime
    ? parseDateTime(workshop.startDate, workshop.endTime)
    : parseDateTime(workshop.startDate, "23:59");

  return {
    id: workshop.id,
    title: workshop.title,
    start,
    end,
    resource: {
      type: "workshop",
      originalData: workshop,
      poster: workshop.poster,
      styles: workshop.styles,
    },
  };
}

/**
 * Convert Session to calendar events (returns array since sessions have multiple dates)
 */
export function convertSessionToCalendarEvents(
  session: CalendarSessionData
): CalendarEvent[] {
  // Parse JSON dates array
  let datesArray: Array<{
    date: string;
    startTime?: string;
    endTime?: string;
  }> = [];
  try {
    const parsed = JSON.parse(session.dates || "[]");
    datesArray = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error parsing session dates:", error);
    return [];
  }

  // Create separate calendar event for each date entry
  return datesArray.map((dateEntry, index) => {
    const start = parseDateTime(
      dateEntry.date,
      dateEntry.startTime || undefined
    );
    const end = dateEntry.endTime
      ? parseDateTime(dateEntry.date, dateEntry.endTime)
      : parseDateTime(dateEntry.date, "23:59");

    return {
      id: `${session.id}-${index}`,
      title: session.title,
      start,
      end,
      resource: {
        type: "session",
        originalData: session,
        dateEntry: dateEntry, // Store the specific date entry
        poster: session.poster,
        styles: session.styles,
      },
    };
  });
}
