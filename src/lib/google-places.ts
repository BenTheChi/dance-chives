/**
 * Google Places API and Time Zone API helpers
 * Only called when necessary - check Neo4j first before using these functions
 */

const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_TIMEZONE_API_KEY =
  process.env.GOOGLE_TIMEZONE_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface GooglePlacePrediction {
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  address_components: Array<{
    types: string[];
    short_name: string;
    long_name: string;
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

export interface TimeZoneResult {
  timeZoneId: string;
  timeZoneName: string;
}

/**
 * Search Google Places Autocomplete API for cities only
 * Uses types=(cities) to restrict results to cities only
 */
export async function searchPlaces(
  keyword: string
): Promise<GooglePlacePrediction[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places API key not configured");
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json"
  );
  url.searchParams.set("input", keyword);
  url.searchParams.set("types", "(cities)");
  url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  // Filter to ensure only city-level places
  const predictions = (data.predictions || []).filter(
    (pred: GooglePlacePrediction) => {
      // Include if it has city-related types
      const cityTypes = [
        "locality",
        "administrative_area_level_1",
        "administrative_area_level_2",
      ];
      return pred.types.some((type) => cityTypes.includes(type));
    }
  );

  return predictions;
}

/**
 * Get place details from Google Places API
 * Only called when city doesn't exist in database - check Neo4j first
 */
export async function getPlaceDetails(
  placeId: string
): Promise<GooglePlaceDetails> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places API key not configured");
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "place_id,name,formatted_address,address_components,geometry,types"
  );
  url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  // Validate that the place is a city-level location
  const result = data.result as GooglePlaceDetails;
  const cityTypes = [
    "locality",
    "administrative_area_level_1",
    "administrative_area_level_2",
  ];
  const isCity = result.types.some((type) => cityTypes.includes(type));

  if (!isCity) {
    throw new Error("Place is not a city-level location");
  }

  return result;
}

/**
 * Get timezone from Google Time Zone API using coordinates
 * Only called when timezone is missing - check stored data first
 */
export async function getTimezone(
  lat: number,
  lng: number,
  timestamp?: number
): Promise<TimeZoneResult> {
  if (!GOOGLE_TIMEZONE_API_KEY) {
    throw new Error("Google Time Zone API key not configured");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/timezone/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set(
    "timestamp",
    timestamp ? timestamp.toString() : Math.floor(Date.now() / 1000).toString()
  );
  url.searchParams.set("key", GOOGLE_TIMEZONE_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Time Zone API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google Time Zone API error: ${data.status}`);
  }

  return {
    timeZoneId: data.timeZoneId,
    timeZoneName: data.timeZoneName,
  };
}
