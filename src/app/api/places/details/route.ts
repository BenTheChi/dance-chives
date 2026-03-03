import { NextRequest, NextResponse } from "next/server";
import { resolveAndUpsertCityForWrite } from "@/db/queries/city";

/**
 * Resolve a place id to canonical city metadata and upsert if needed.
 * Called when creating/editing events with new cities.
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
    // Provide minimal placeholder metadata; resolver fetches Google details
    // when needed and canonicalizes against existing city metadata first.
    const canonicalCity = await resolveAndUpsertCityForWrite({
      id: placeId,
      name: "",
      region: "",
      countryCode: "",
    });

    return NextResponse.json({ city: canonicalCity });
  } catch (error) {
    console.error("Error fetching place details:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
