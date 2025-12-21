import { AppNavbar } from "@/components/AppNavbar";
import { getAllCities, getAllStyles, getCalendarEvents } from "@/db/queries/event";
import { redirect } from "next/navigation";
import { CalendarPageClient } from "@/components/CalendarPageClient";
import { parseCityFromUrl, parseStyleFromUrl } from "@/lib/utils/calendar-url-utils";
import { auth } from "@/auth";
import { getUser } from "@/db/queries/user";

type PageProps = {
  searchParams: Promise<{ city?: string; style?: string }>;
};

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cityParam = params.city;
  const styleParam = params.style;

  // Fetch all cities and styles
  const cities = await getAllCities();
  const styles = await getAllStyles();

  // Get current user's city if logged in
  const session = await auth();
  let userCity: { slug?: string } | null = null;
  if (session?.user?.id) {
    const user = await getUser(session.user.id);
    if (user?.city?.slug) {
      userCity = { slug: user.city.slug };
    }
  }

  // Parse city from URL param
  let selectedCity = cityParam ? parseCityFromUrl(cityParam, cities) : null;

  // If no city selected, default to user's city if logged in
  if (!selectedCity && userCity?.slug) {
    const userCityInList = cities.find((c) => c.slug === userCity.slug);
    if (userCityInList) {
      selectedCity = userCityInList;
      // Redirect to user's city if not already in URL
      if (!cityParam) {
        const redirectParams = new URLSearchParams();
        redirectParams.set("city", userCityInList.slug!);
        if (styleParam) {
          redirectParams.set("style", styleParam);
        }
        redirect(`/calendar?${redirectParams.toString()}`);
      }
    }
  }

  // If still no city selected and user is not logged in, allow "Select City" state
  // If user is logged in but has no city, also allow "Select City" state
  // Only fetch events if a city is selected
  const selectedStyle = styleParam
    ? parseStyleFromUrl(styleParam, styles)
    : null;

  const events = selectedCity
    ? await getCalendarEvents(selectedCity.slug!, selectedStyle || undefined)
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

