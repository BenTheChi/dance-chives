import { revalidatePath } from "next/cache";
import { City } from "@/types/city";
import { generateCitySlug } from "@/lib/utils/city-slug";

const CALENDAR_PATH = "/calendar";

export function getCitySlug(city?: City | null): string | null {
  if (!city) {
    return null;
  }

  const slugCandidate = city.slug?.trim();
  if (slugCandidate) {
    return slugCandidate;
  }

  if (city.name && city.countryCode) {
    return generateCitySlug(city);
  }

  return null;
}

export async function revalidateCalendarForSlugs(
  citySlugs: Array<string | null | undefined>
): Promise<void> {
  // Revalidate the calendar page - this will invalidate the page cache
  // The unstable_cache in calendar_actions.ts will naturally expire based on its revalidate time (5 minutes)
  revalidatePath(CALENDAR_PATH);
}


