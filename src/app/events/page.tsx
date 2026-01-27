import { getEventCards } from "@/db/queries/event-cards";
import { getAllCities, getAllStyles } from "@/db/queries/event";
import { EventsClient } from "./events-client";
import { prisma } from "@/lib/primsa";
import { TEventCard } from "@/types/event";

// Enable static generation with revalidation
// 12 hours - comprehensive on-demand revalidation covers most updates
export const revalidate = 43200; // Revalidate every 12 hours

// Helper to parse date string (MM/DD/YYYY or YYYY-MM-DD format)
function parseEventDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    if (dateStr.includes("-")) {
      return new Date(dateStr);
    }
    const [month, day, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
}

export default async function EventsPage() {
  // Fetch events and filter data without auth (static generation)
  const [events, cities, styles] = await Promise.all([
    getEventCards(),
    getAllCities(),
    getAllStyles(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Batch fetch all dates for events with additional dates
  const eventsWithAdditionalDates = events.filter(
    (e) => e.additionalDatesCount && e.additionalDatesCount > 0
  );
  const eventIdsWithAdditionalDates = eventsWithAdditionalDates.map(
    (e) => e.id
  );

  let allEventDates = new Map<
    string,
    Array<{ eventId: string; localDate: Date | null; startUtc: Date }>
  >();
  if (eventIdsWithAdditionalDates.length > 0) {
    const dates = await prisma.eventDate.findMany({
      where: { eventId: { in: eventIdsWithAdditionalDates } },
      orderBy: [{ startUtc: "asc" }, { id: "asc" }],
    });

    // Group dates by eventId
    dates.forEach((date) => {
      if (!allEventDates.has(date.eventId)) {
        allEventDates.set(date.eventId, []);
      }
      allEventDates.get(date.eventId)!.push(date);
    });
  }

  // Get sort date for each event
  const eventSortDates = events.map((event) => {
    let sortDate: Date | null = null;

    // For events with additional dates, use the fetched dates
    if (event.additionalDatesCount && event.additionalDatesCount > 0) {
      const dates = allEventDates.get(event.id) || [];
      const parsedDates: Date[] = [];
      dates.forEach((d) => {
        let date: Date | null = null;
        if (d.localDate) {
          date = new Date(d.localDate);
        } else if (d.startUtc) {
          date = new Date(d.startUtc);
        }
        if (date && !Number.isNaN(date.getTime())) {
          date.setHours(0, 0, 0, 0);
          parsedDates.push(date);
        }
      });

      const futureDates = parsedDates.filter((d) => d >= today);
      const pastDates = parsedDates.filter((d) => d < today);

      // Return earliest future date if exists, otherwise latest past date
      if (futureDates.length > 0) {
        sortDate = futureDates.sort((a, b) => a.getTime() - b.getTime())[0];
      } else if (pastDates.length > 0) {
        sortDate = pastDates.sort((a, b) => b.getTime() - a.getTime())[0];
      }
    }

    // Fall back to primary date if no sort date determined
    if (!sortDate) {
      sortDate = parseEventDate(event.date);
    }

    return { event, sortDate };
  });

  // Separate into past and future events
  const futureEvents: TEventCard[] = [];
  const pastEvents: TEventCard[] = [];

  for (const { event, sortDate } of eventSortDates) {
    if (!sortDate) {
      // Events without valid dates go to future by default
      futureEvents.push(event);
      continue;
    }

    if (sortDate >= today) {
      futureEvents.push(event);
    } else {
      pastEvents.push(event);
    }
  }

  // Sort future events: soonest to later (ascending)
  futureEvents.sort((a, b) => {
    const dateA = eventSortDates.find((e) => e.event.id === a.id)?.sortDate;
    const dateB = eventSortDates.find((e) => e.event.id === b.id)?.sortDate;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA.getTime() - dateB.getTime();
  });

  // Sort past events: most recent to oldest (descending)
  pastEvents.sort((a, b) => {
    const dateA = eventSortDates.find((e) => e.event.id === a.id)?.sortDate;
    const dateB = eventSortDates.find((e) => e.event.id === b.id)?.sortDate;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <>
      <div className="flex flex-col">
        <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
          All Events
        </h1>
        <div className="relative flex-1 flex flex-col">
          {/* Content */}
          <div className="relative z-10 flex justify-center flex-1 min-h-0">
            <div className="flex flex-col items-center py-2 sm:py-8 w-full">
              {/* Client component handles auth-dependent features */}
              <EventsClient
                futureEvents={futureEvents}
                pastEvents={pastEvents}
                cities={cities}
                styles={styles}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
