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
      <main>
        <AppNavbar />
        <div className="flex flex-col items-center px-4 py-8">
          <h1 className="!text-[60px] mt-5 mb-12">All Events</h1>
          {/* Client component handles auth-dependent features */}
          <EventsClient events={events} />
        </div>
      </main>
    </>
  );
}
