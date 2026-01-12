import { AppNavbar } from "@/components/AppNavbar";
import {
  getAllCities,
  getAllStyles,
  getCalendarEvents,
} from "@/db/queries/event";
import { CalendarPageClient } from "@/components/CalendarPageClient";
import {
  parseCityFromUrl,
  parseStyleFromUrl,
} from "@/lib/utils/calendar-url-utils";
import { generateCitySlug } from "@/lib/utils/city-slug";
import { subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";

// Enable static generation with revalidation (ISR)
// 12 hours - comprehensive on-demand revalidation covers most updates
export const revalidate = 43200; // Revalidate every 12 hours

type PageProps = {
  searchParams: Promise<{ city?: string; style?: string }>;
};

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cityParam = params.city;
  const styleParam = params.style;

  // Fetch all cities and styles in parallel (no auth dependency - enables ISR)
  const [citiesRaw, styles] = await Promise.all([
    getAllCities(),
    getAllStyles(),
  ]);
  
  // Compute slugs for all cities
  const cities = citiesRaw.map((city) => ({
    ...city,
    slug: generateCitySlug(city),
  }));

  // Parse city from URL param (user-specific defaults handled client-side)
  const selectedCity = cityParam ? parseCityFromUrl(cityParam, cities) : null;

  const selectedStyle = styleParam
    ? parseStyleFromUrl(styleParam, styles)
    : null;

  // Calculate 3-month date range: month before, current month, month after
  const currentDate = new Date();
  const startDate = startOfMonth(subMonths(currentDate, 1));
  const endDate = endOfMonth(addMonths(currentDate, 1));

  const events = selectedCity
    ? await getCalendarEvents(
        selectedCity.slug!,
        selectedStyle || undefined,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        citiesRaw // Reuse already-fetched cities to avoid redundant getAllCities call
      )
    : [];

  return (
    <>
      <AppNavbar />
      <CalendarPageClient
        cities={cities}
        styles={styles}
        initialCity={selectedCity}
        initialStyle={selectedStyle}
        events={events}
      />
    </>
  );
}
