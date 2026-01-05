import { AppNavbar } from "@/components/AppNavbar";
import { getEventCards } from "@/db/queries/event-cards";
import { getAllCities, getAllStyles } from "@/db/queries/event";
import { EventsClient } from "./events-client";

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

export default async function EventsPage() {
  // Fetch events and filter data without auth (static generation)
  const [events, cities, styles] = await Promise.all([
    getEventCards(),
    getAllCities(),
    getAllStyles(),
  ]);

  return (
    <>
      <div className="flex flex-col">
        <AppNavbar />
        <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
          All Events
        </h1>
        <div className="relative flex-1 flex flex-col">
          {/* Content */}
          <div className="relative z-10 flex justify-center flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col items-center py-8 w-full">
              {/* Client component handles auth-dependent features */}
              <EventsClient events={events} cities={cities} styles={styles} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
