import { prisma } from "@/lib/primsa";
import { EventType, TEventCard } from "@/types/event";

export async function getEventCards(): Promise<TEventCard[]> {
  const rows = await prisma.eventCard.findMany({
    where: {
      status: "visible",
    } as any, // Type assertion until Prisma client is regenerated
    orderBy: [{ updatedAt: "desc" }],
  });

  return rows.map((r) => ({
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
