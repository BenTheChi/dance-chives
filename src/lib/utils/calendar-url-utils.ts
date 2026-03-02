import { City } from "@/types/city";
import { EventType } from "@/types/event";
import {
  normalizeStyleName,
  resolveCanonicalStyleName,
} from "@/lib/utils/style-utils";

/** All valid EventType values for URL parsing */
const VALID_EVENT_TYPES: EventType[] = [
  "Battle",
  "Competition",
  "Class",
  "Workshop",
  "Session",
  "Party",
  "Festival",
  "Performance",
  "Other",
];

/**
 * Finds a city by slug from URL parameter
 * @param citySlug - The city slug from URL
 * @param cities - Array of all available cities
 * @returns Matching City object or null if not found
 */
export function parseCityFromUrl(
  citySlug: string,
  cities: City[]
): City | null {
  if (!citySlug) return null;

  const decodedSlug = decodeURIComponent(citySlug);
  return cities.find((city) => city.slug === decodedSlug) || null;
}

/**
 * Parses a country code from URL parameter (case-insensitive)
 * and validates it against available cities.
 */
export function parseCountryFromUrl(
  countryParam: string,
  cities: City[]
): string | null {
  if (!countryParam) return null;

  const decodedCountry = decodeURIComponent(countryParam).toUpperCase().trim();
  if (!decodedCountry) return null;

  const exists = cities.some(
    (city) => city.countryCode.toUpperCase() === decodedCountry
  );
  return exists ? decodedCountry : null;
}

/**
 * Converts style name to canonical Title Case for URL parameter
 * @param style - Style name (any case)
 * @returns Canonical style name for URL
 */
export function normalizeStyleForUrl(style: string): string {
  return normalizeStyleName(style);
}

/**
 * Finds a style by matching the URL parameter against available styles
 * @param styleParam - The style name from URL (any case)
 * @param styles - Array of available styles (any case)
 * @returns Canonical style name or null if not found
 */
export function parseStyleFromUrl(
  styleParam: string,
  styles: string[]
): string | null {
  if (!styleParam) return null;

  const canonicalParam = resolveCanonicalStyleName(
    decodeURIComponent(styleParam)
  );
  if (!canonicalParam) return null;

  const available = new Set(
    styles
      .map((style) => resolveCanonicalStyleName(style))
      .filter(
        (
          style
        ): style is NonNullable<ReturnType<typeof resolveCanonicalStyleName>> =>
          style !== null
      )
  );

  return available.has(canonicalParam) ? canonicalParam : null;
}

/**
 * Parses an EventType from a URL parameter (case-insensitive match)
 * @param eventTypeParam - The event type string from URL
 * @returns Matching EventType or null if not found
 */
export function parseEventTypeFromUrl(
  eventTypeParam: string
): EventType | null {
  if (!eventTypeParam) return null;

  const decoded = decodeURIComponent(eventTypeParam).toLowerCase();
  return (
    VALID_EVENT_TYPES.find((t) => t.toLowerCase() === decoded) || null
  );
}

/**
 * Converts an EventType to a URL-safe string
 * @param eventType - The EventType value
 * @returns The event type string for URL (same casing as EventType)
 */
export function normalizeEventTypeForUrl(eventType: EventType): string {
  return eventType;
}

/**
 * Converts a country code to URL-safe uppercase form.
 */
export function normalizeCountryForUrl(countryCode: string): string {
  return countryCode.trim().toUpperCase();
}
