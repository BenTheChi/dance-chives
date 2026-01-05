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
 * @param limit - Maximum number of events to return (default: 3)
 */
export async function getUpcomingEventCards(limit: number = 3): Promise<TEventCard[]> {
  const now = new Date();
  
  // Get event IDs with upcoming dates
  const upcomingEventDates = await prisma.eventDate.findMany({
    where: {
      startUtc: {
        gte: now,
      },
    },
    orderBy: {
      startUtc: "asc",
    },
    distinct: ["eventId"],
    take: limit,
  });

  const eventIds = upcomingEventDates.map((ed) => ed.eventId);

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
