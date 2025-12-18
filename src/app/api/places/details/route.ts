import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetails, getTimezone } from "@/lib/google-places";
import { City } from "@/types/city";

/**
 * Get place details with timezone (validates city-level place)
 * Called when creating/editing events with new cities
 * GET /api/places/details?placeId=...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "placeId parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Get place details from Google Places API
    const placeDetails = await getPlaceDetails(placeId);

    // Extract address components
    const addressComponents = placeDetails.address_components;
    const region =
      addressComponents.find((ac) =>
        ac.types.includes("administrative_area_level_1")
      )?.short_name || "";
    const countryCode =
      addressComponents.find((ac) => ac.types.includes("country"))
        ?.short_name || "";

    // Get timezone from Google Time Zone API
    const timezoneResult = await getTimezone(
      placeDetails.geometry.location.lat,
      placeDetails.geometry.location.lng
    );

    // Map to City interface
    const city: City = {
      id: placeDetails.place_id,
      name: placeDetails.name || placeDetails.formatted_address,
      region,
      countryCode,
      timezone: timezoneResult.timeZoneId,
      latitude: placeDetails.geometry.location.lat,
      longitude: placeDetails.geometry.location.lng,
    };

    return NextResponse.json({ city });
  } catch (error) {
    console.error("Error fetching place details:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
