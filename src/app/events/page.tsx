import Eventcard from "@/components/cards";
import { AppNavbar } from "@/components/AppNavbar";
import { getEvents } from "@/db/queries/event";
import { EventCard } from "@/types/event";

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <>
      <main>
        <AppNavbar />
        <div className="flex flex-wrap gap-3 p-5">
          {events.map((event: EventCard) => (
            <Eventcard
              key={event.id}
              id={event.id}
              title={event.title}
              series={event.series}
              imageUrl={event.imageUrl}
              date={event.date}
              city={event.city}
              styles={event.styles}
            />
          ))}
        </div>
      </main>
    </>
  );
}
