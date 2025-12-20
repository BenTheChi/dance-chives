import { EventCard } from "@/components/EventCard";
import { AppNavbar } from "@/components/AppNavbar";
import { getEventCards } from "@/db/queries/event-cards";
import { TEventCard } from "@/types/event";
import { auth } from "@/auth";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";

export default async function EventsPage() {
  const events = await getEventCards();
  const session = await auth();
  const savedResult = session?.user?.id
    ? await getSavedEventIds()
    : { status: 200, eventIds: [] };
  const savedEventIds = new Set(
    savedResult.status === 200 && "eventIds" in savedResult
      ? savedResult.eventIds
      : []
  );

  return (
    <>
      <main>
        <AppNavbar />
        <div className="flex flex-col items-center px-4 py-8">
          <h1 className="!text-[60px] mt-5 mb-12">All Events</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {events.map((event: TEventCard) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                series={event.series}
                imageUrl={event.imageUrl}
                date={event.date}
                city={event.city}
                cityId={event.cityId}
                styles={event.styles}
                eventType={event.eventType}
                isSaved={savedEventIds.has(event.id)}
              />
            ))}
          </div>
          {events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events found.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
