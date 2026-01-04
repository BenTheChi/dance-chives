import { AppNavbar } from "@/components/AppNavbar";
import { getEventCards } from "@/db/queries/event-cards";
import { City } from "@/types/city";
import { EventsClient } from "./events-client";

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate every hour

const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.dancechives.com";

export default async function EventsPage() {
  // Fetch events without auth (static generation)
  const events = await getEventCards();

  const [cities, styles] = await Promise.all([
    fetch(`${SITE_BASE_URL}/api/cities`, { next: { revalidate } })
      .then(async (res) => {
        if (!res.ok) return [];
        const data = (await res.json()) as { cities?: unknown };
        return Array.isArray(data?.cities) ? (data.cities as City[]) : [];
      })
      .catch((error) => {
        console.error("Failed to load cities for filters:", error);
        return [] as City[];
      }),
    fetch(`${SITE_BASE_URL}/api/styles`, { next: { revalidate } })
      .then(async (res) => {
        if (!res.ok) return [];
        const data = (await res.json()) as { styles?: unknown };
        return Array.isArray(data?.styles) ? (data.styles as string[]) : [];
      })
      .catch((error) => {
        console.error("Failed to load styles for filters:", error);
        return [] as string[];
      }),
  ]);

  return (
    <>
      <div className="flex flex-col">
        <AppNavbar />
        <h1 className="py-7 border-b-2 border-primary-light">All Events</h1>
        <div className="flex justify-center flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col items-center px-4 py-8 w-full">
            {/* Client component handles auth-dependent features */}
            <EventsClient events={events} cities={cities} styles={styles} />
          </div>
        </div>
      </div>
    </>
  );
}
