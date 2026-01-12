"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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

export function revalidateCalendarForSlugs(
  citySlugs: Array<string | null | undefined>
) {
  const normalizedSlugs = Array.from(
    new Set(
      citySlugs
        .map((slug) => slug?.trim())
        .filter((slug): slug is string => Boolean(slug))
    )
  );

  if (normalizedSlugs.length === 0) {
    return;
  }

  revalidatePath(CALENDAR_PATH);
  for (const slug of normalizedSlugs) {
    revalidateTag(`calendar-events-${slug}`);
  }
}


