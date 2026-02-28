import { City } from "@/types/city";

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
