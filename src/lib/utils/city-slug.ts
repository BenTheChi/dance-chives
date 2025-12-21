import { City } from "@/types/city";

/**
 * Generates a URL-safe slug from city data
 * Format: {name}-{region}-{countryCode} (lowercase, hyphens)
 * 
 * @param city - City object with name, region, and countryCode
 * @returns URL-safe slug string
 */
export function generateCitySlug(city: City): string {
  const parts: string[] = [];

  // Add city name (required)
  if (city.name) {
    parts.push(slugify(city.name));
  }

  // Add region if available
  if (city.region && city.region.trim()) {
    parts.push(slugify(city.region));
  }

  // Add country code if available
  if (city.countryCode && city.countryCode.trim()) {
    parts.push(slugify(city.countryCode));
  }

  return parts.join("-");
}

/**
 * Converts a string to a URL-safe slug
 * - Converts to lowercase
 * - Replaces spaces and special characters with hyphens
 * - Removes leading/trailing hyphens
 * - Collapses multiple hyphens into one
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and common separators with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, "")
    // Collapse multiple hyphens into one
    .replace(/-+/g, "-")
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, "");
}

