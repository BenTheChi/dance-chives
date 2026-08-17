import { NextRequest, NextResponse } from "next/server";
import {
  resolveAndUpsertUnknownCountryCity,
  resolveUnknownCity,
} from "@/db/queries/city";

/**
 * Resolve a publish-fallback sentinel city. One boundary for "give me a
 * fallback city", with two levels:
 *
 *   GET /api/places/country?cc=FR  -> "Unknown, France" (unknown-fr)
 *   GET /api/places/country        -> "Unknown"        (unknown)
 *
 * The auto-manager calls the first when an event resolves to a country but no
 * city, and the second when it resolves to neither. Parallels
 * GET /api/places/details for real cities.
 *
 * Note that omitting `cc` is a distinct, valid request -- but a *present but
 * malformed* `cc` is still an error, so a caller that meant to send a country
 * and got it wrong does not silently fall through to the country-less bucket.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("cc");
  const cc = raw?.trim() ?? "";

  if (raw !== null && !/^[A-Za-z]{2}$/.test(cc)) {
    return NextResponse.json(
      { error: "cc parameter must be an ISO 3166-1 alpha-2 country code" },
      { status: 400 }
    );
  }

  try {
    const city = cc
      ? await resolveAndUpsertUnknownCountryCity(cc)
      : await resolveUnknownCity();
    return NextResponse.json({ city });
  } catch (error) {
    console.error("Error resolving fallback city:", error);
    return NextResponse.json(
      { error: cc ? "Failed to resolve country" : "Failed to resolve fallback city" },
      { status: 500 }
    );
  }
}
