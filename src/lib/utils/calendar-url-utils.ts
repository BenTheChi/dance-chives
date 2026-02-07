import { City } from "@/types/city";
import { EventType } from "@/types/event";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";

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
 * Converts style name to uppercase for URL parameter
 * @param style - Style name (any case)
 * @returns Uppercase style name for URL
 */
export function normalizeStyleForUrl(style: string): string {
  return formatStyleNameForDisplay(style);
}

/**
 * Finds a style by matching the URL parameter (uppercase) against available styles
 * @param styleParam - The style name from URL (uppercase)
 * @param styles - Array of all available styles (lowercase in DB)
 * @returns Matching style name (lowercase) or null if not found
 */
export function parseStyleFromUrl(
  styleParam: string,
  styles: string[]
): string | null {
  if (!styleParam) return null;

  const decodedStyle = decodeURIComponent(styleParam).toUpperCase();
  const normalizedStyle = styles.find(
    (style) => formatStyleNameForDisplay(style) === decodedStyle
  );

  return normalizedStyle || null;
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

