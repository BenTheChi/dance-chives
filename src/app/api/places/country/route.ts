import { NextRequest, NextResponse } from "next/server";
import { resolveUnknownCity } from "@/db/queries/city";

/**
 * Resolve the country-less `unknown` sentinel city.
 *
 *   GET /api/places/country  -> "Unknown" (unknown)
 *
 * The publish fallback for an event with no location at all. Parallels
 * GET /api/places/details for real cities.
 *
 * The `cc` form is GONE. It used to mint an "Unknown, {Country}" sentinel
 * CITY, which meant a fake place at lat/lng 0 standing in for a country, and
 * it depended on the Geocoding API — a dependency whose silent failure
 * stranded 163 events on the bare `unknown` city. Country is now a real
 * (:Country) node with a direct (:Event)-[:IN]->(:Country) edge, so there is
 * nothing left to mint. A `cc` parameter is rejected rather than ignored, so a
 * stale caller fails loudly instead of silently filing its event as
 * location-less.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("cc");

  if (raw !== null) {
    return NextResponse.json(
      {
        error:
          "the cc parameter is no longer supported: countries are (:Country) nodes, not sentinel cities",
      },
      { status: 400 }
    );
  }

  try {
    const city = await resolveUnknownCity();
    return NextResponse.json({ city });
  } catch (error) {
    console.error("Error resolving fallback city:", error);
    return NextResponse.json(
      { error: "Failed to resolve fallback city" },
      { status: 500 }
    );
  }
}
