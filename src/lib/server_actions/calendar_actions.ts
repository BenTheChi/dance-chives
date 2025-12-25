"use server";

import { unstable_cache } from "next/cache";
import { getCalendarEvents } from "@/db/queries/event";
import { CalendarEventData } from "@/db/queries/event";

/**
 * Fetch calendar events for a city with caching
 * Cache key includes city, style, and date range for proper invalidation
 */
export async function fetchCalendarEvents(
  citySlug: string,
  style?: string | null,
  startDate?: string,
  endDate?: string
): Promise<CalendarEventData[]> {
  if (!citySlug) {
    return [];
  }

  // Create a cache key based on the parameters
  const cacheKey = `calendar-events-${citySlug}-${style || "all"}-${startDate || "none"}-${endDate || "none"}`;

  // Cache for 5 minutes (300 seconds) - events don't change frequently
  // Tag with city slug for easy invalidation if needed
  const getCachedEvents = unstable_cache(
    async () => {
      try {
        return await getCalendarEvents(
          citySlug,
          style || undefined,
          startDate || undefined,
          endDate || undefined
        );
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        return [];
      }
    },
    [cacheKey],
    {
      tags: [`calendar-events-${citySlug}`],
      revalidate: 300, // 5 minutes
    }
  );

  return getCachedEvents();
}

