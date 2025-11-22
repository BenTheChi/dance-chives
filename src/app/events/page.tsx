import Eventcard from "@/components/cards";
import { AppNavbar } from "@/components/AppNavbar";
import { getEvents } from "@/db/queries/competition";
import { EventCard } from "@/types/event";

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <>
      <main>
        <AppNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {events.map((event: EventCard) => (
              <Eventcard
                key={event.id}
                id={event.id}
                title={event.title}
                series={event.series}
                imageUrl={event.imageUrl}
                date={event.date}
                city={event.city}
                cityId={event.cityId}
                styles={event.styles}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
