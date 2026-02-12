import { prisma } from "@/lib/primsa";
import { Prisma } from "@prisma/client";
import { EventType, TEventCard } from "@/types/event";

export async function getEventCards(): Promise<TEventCard[]> {
  const rows = await prisma.eventCard.findMany({
    where: {
      status: "visible",
    } as any, // Type assertion until Prisma client is regenerated
    orderBy: [{ updatedAt: "desc" }],
  });

  // Efficiently check for videos: batch check all events at once using a single query
  const eventIds = rows.map((r) => r.eventId);
  const eventsWithVideos = await prisma.sectionCard.findMany({
    where: {
      eventId: { in: eventIds },
      totalVideoCount: { gt: 0 },
    },
    select: {
      eventId: true,
    },
    distinct: ["eventId"], // Only need one section per event to know it has videos
  });

  const eventIdsWithVideos = new Set(eventsWithVideos.map((s) => s.eventId));

  return rows.map((r) => {
    return {
      id: r.eventId,
      title: r.title,
      series: undefined,
      imageUrl: r.posterUrl ?? undefined,
      date: r.displayDateLocal ?? "",
      city: r.cityName ?? "",
      cityId: r.cityId ?? undefined,
      styles: r.styles ?? [],
      eventType: r.eventType ? (r.eventType as unknown as EventType) : undefined,
      additionalDatesCount: r.additionalDatesCount ?? 0,
      status: ((r as any).status as "hidden" | "visible") || "visible",
      hasVideos: eventIdsWithVideos.has(r.eventId),
    };
  });
}

/**
 * Get distinct styles that appear on any visible event.
 * Uses PostgreSQL unnest + GIN index on the styles array for efficiency.
 */
export async function getUsedStylesFromEvents(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ style: string }[]>(
    Prisma.sql`
      SELECT DISTINCT unnest(styles) AS style
      FROM "event_cards"
      WHERE status = 'visible'
        AND array_length(styles, 1) > 0
      ORDER BY style ASC
    `
  );
  // Dedupe case-insensitively (DB DISTINCT is case-sensitive); keep first occurrence
  const seen = new Set<string>();
  return rows
    .map((r) => r.style?.trim())
    .filter((s): s is string => Boolean(s))
    .filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Get distinct styles from visible events that have at least one future date.
 * Joins EventCard with EventDate to filter for future occurrences only.
 */
export async function getUsedStylesFromFutureEvents(): Promise<string[]> {
  const now = new Date();
  const rows = await prisma.$queryRaw<{ style: string }[]>(
    Prisma.sql`
      SELECT DISTINCT unnest(ec.styles) AS style
      FROM "event_cards" ec
      INNER JOIN "event_dates" ed ON ec."eventId" = ed."eventId"
      WHERE ec.status = 'visible'
        AND array_length(ec.styles, 1) > 0
        AND ed."startUtc" >= ${now}
      ORDER BY style ASC
    `
  );
  return rows.map((r) => r.style);
}

/**
 * Get upcoming events ordered by start date
 * Only returns battle events
 * @param limit - Maximum number of events to return (default: 3)
 */
export async function getUpcomingEventCards(limit: number = 3): Promise<TEventCard[]> {
  const now = new Date();
  
  // First, get all battle events that are visible
  const battleEvents = await prisma.eventCard.findMany({
    where: {
      eventType: "Battle",
      status: "visible",
    } as any,
    select: {
      eventId: true,
    },
  });

  const battleEventIds = new Set(battleEvents.map((e) => e.eventId));

  if (battleEventIds.size === 0) {
    return [];
  }

  // Get upcoming event dates for battle events only
  // Fetch more to ensure we get enough results after filtering
  const upcomingEventDates = await prisma.eventDate.findMany({
    where: {
      startUtc: {
        gte: now,
      },
      eventId: {
        in: Array.from(battleEventIds),
      },
    },
    orderBy: {
      startUtc: "asc",
    },
    distinct: ["eventId"],
    take: limit * 10, // Fetch more to ensure we have enough battles
  });

  const eventIds = upcomingEventDates.map((ed) => ed.eventId).slice(0, limit);

  if (eventIds.length === 0) {
    return [];
  }

  // Fetch the full event card data for these events
  const eventCards = await prisma.eventCard.findMany({
    where: {
      eventId: {
        in: eventIds,
      },
      status: "visible",
    } as any,
  });

  // Sort by the order of eventIds (which is sorted by startUtc)
  const eventCardsMap = new Map(eventCards.map((ec) => [ec.eventId, ec]));
  const sortedEventCards = eventIds
    .map((id) => eventCardsMap.get(id))
    .filter((ec) => ec !== undefined) as typeof eventCards;

  return sortedEventCards.map((r) => ({
    id: r.eventId,
    title: r.title,
    series: undefined,
    imageUrl: r.posterUrl ?? undefined,
    date: r.displayDateLocal ?? "",
    city: r.cityName ?? "",
    cityId: r.cityId ?? undefined,
    styles: r.styles ?? [],
    eventType: r.eventType ? (r.eventType as unknown as EventType) : undefined,
    additionalDatesCount: r.additionalDatesCount ?? 0,
    status: ((r as any).status as "hidden" | "visible") || "visible",
  }));
}
