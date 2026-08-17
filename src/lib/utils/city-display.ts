import { City } from "@/types/city";

/**
 * Placeholder city ids that stand for "no real place":
 *
 *   online       — online-only events
 *   unknown      — no city and no country
 *   unknown-{cc} — a country, but no city
 *
 * These are real rows in `cities` (events must attach to a City), but they are
 * not places, so they must not appear anywhere a user browses or picks a
 * location. Note that "unknown" does NOT carry the "unknown-" prefix, so a
 * prefix check alone misses it — both forms are tested here deliberately.
 *
 * Lives here rather than in db/queries/city.ts because that module imports
 * Prisma and cannot be pulled into a client component; the filter UI is the
 * main consumer. db/queries/city.ts re-exports this as the single definition.
 */
export const isSentinelCityId = (cityId?: string | null): boolean => {
  const id = (cityId || "").trim().toLowerCase();
  if (!id) return false;

  return id === "online" || id === "unknown" || /^unknown-[a-z]{2}$/.test(id);
};

const TRAILING_COUNTRY_REGEX =
  /,\s*(usa|u\.s\.a\.|us|united states(?: of america)?|canada)$/i;

function isCountryOnlyToken(value: string, countryCode?: string): boolean {
  const token = value.trim().toLowerCase().replace(/\./g, "");
  if (!token) return false;

  if (countryCode && token === countryCode.trim().toLowerCase()) {
    return true;
  }

  return (
    token === "usa" ||
    token === "us" ||
    token === "united states" ||
    token === "united states of america" ||
    token === "canada"
  );
}

/**
 * Normalizes region text for display only.
 * Keeps storage untouched and avoids changing slugs/URLs.
 */
export function normalizeRegionForDisplay(
  region: string | null | undefined,
  countryCode?: string
): string {
  if (!region) return "";

  let normalized = region.trim();
  if (!normalized) return "";

  normalized = normalized.replace(TRAILING_COUNTRY_REGEX, "").trim();

  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    const tail = parts[parts.length - 1];
    if (isCountryOnlyToken(tail, countryCode)) {
      parts.pop();
    }
    normalized = parts.join(", ").trim();
  }

  if (isCountryOnlyToken(normalized, countryCode)) {
    return "";
  }

  return normalized;
}

export function formatCityDisplayLabel(city: Pick<City, "name" | "region" | "countryCode">): string {
  const region = normalizeRegionForDisplay(city.region, city.countryCode);
  return region ? `${city.name}, ${region}` : city.name;
}
