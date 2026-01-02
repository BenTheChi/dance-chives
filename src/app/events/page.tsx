import { AppNavbar } from "@/components/AppNavbar";
import { getEventCards } from "@/db/queries/event-cards";
import { EventsClient } from "./events-client";

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

export default async function EventsPage() {
  // Fetch events without auth (static generation)
  const events = await getEventCards();

  return (
    <>
      <div className="flex flex-col">
        <AppNavbar />
        <h1 className="py-7 border-b-2 border-primary-light">All Events</h1>
        <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col items-center px-4 py-8 w-full">
            {/* Client component handles auth-dependent features */}
            <EventsClient events={events} />
          </div>
        </div>
      </div>
    </>
  );
}
