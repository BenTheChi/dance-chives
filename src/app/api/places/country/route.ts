import { NextRequest, NextResponse } from "next/server";
import { resolveAndUpsertUnknownCountryCity } from "@/db/queries/city";

/**
 * Resolve an ISO country code to its "Unknown, {Country}" sentinel city,
 * creating it on first use. The auto-manager calls this when an event resolves
 * to a country but no city, so it can publish into a temporary country-level
 * home. Parallels GET /api/places/details for real cities.
 * GET /api/places/country?cc=FR
 */
export async function GET(request: NextRequest) {
  const cc = request.nextUrl.searchParams.get("cc");

  if (!cc || !/^[A-Za-z]{2}$/.test(cc.trim())) {
    return NextResponse.json(
      { error: "cc parameter must be an ISO 3166-1 alpha-2 country code" },
      { status: 400 }
    );
  }

  try {
    const city = await resolveAndUpsertUnknownCountryCity(cc);
    return NextResponse.json({ city });
  } catch (error) {
    console.error("Error resolving unknown-country city:", error);
    return NextResponse.json(
      { error: "Failed to resolve country" },
      { status: 500 }
    );
  }
}
