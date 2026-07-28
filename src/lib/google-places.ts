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

export interface CountryDetails {
  /** Google place_id of the country geocode result. */
  placeId: string;
  /** ISO 3166-1 alpha-2 code, uppercased (e.g. "FR"). */
  countryCode: string;
  /** Canonical country name from Google (e.g. "France"). */
  name: string;
  /** Representative timezone at the country's centroid. */
  timezone: string;
  latitude: number;
  longitude: number;
}

/**
 * Resolve an ISO 3166-1 alpha-2 country code to canonical country metadata:
 * name, centroid coordinates, and a representative timezone.
 *
 * Used only for the "Unknown, {Country}" sentinel cities the auto-manager
 * publishes into when an event resolves to a country but no city. A country
 * has no single timezone; we take the timezone at Google's returned centroid
 * as a representative anchor for year/day-precision event dates.
 *
 * Geocoding by `components=country:{cc}` (not Places autocomplete, which is
 * city-filtered) so the result is always the country polygon itself.
 */
export async function getCountryDetails(
  countryCode: string
): Promise<CountryDetails> {
  const cc = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) {
    throw new Error(`Invalid ISO country code: "${countryCode}"`);
  }
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places API key not configured");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("components", `country:${cc}`);
  url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Geocoding API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(`Google Geocoding API error for ${cc}: ${data.status}`);
  }

  const result = data.results[0];
  const isCountry = (result.types || []).includes("country");
  if (!isCountry) {
    throw new Error(`Geocode for ${cc} is not a country-level result`);
  }

  const countryComponent = (result.address_components || []).find(
    (c: { types: string[] }) => c.types.includes("country")
  );
  const resolvedCc = (countryComponent?.short_name || cc).toUpperCase();
  const name = countryComponent?.long_name || result.formatted_address;

  const lat = result.geometry.location.lat;
  const lng = result.geometry.location.lng;
  const tz = await getTimezone(lat, lng);

  return {
    placeId: result.place_id,
    countryCode: resolvedCc,
    name,
    timezone: tz.timeZoneId,
    latitude: lat,
    longitude: lng,
  };
}
