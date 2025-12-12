import { prisma } from "@/lib/primsa";
import { EventType, TEventCard } from "@/types/event";

export async function getEventCards(): Promise<TEventCard[]> {
  const rows = await prisma.eventCard.findMany({
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
  }));
}
