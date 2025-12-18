import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/google-places";
import { CitySearchItem } from "@/types/city";

/**
 * Direct Google Places Autocomplete search (restricted to cities only)
 * Only called when explicitly requested (0 Neo4j results or "Find More" button clicked)
 * GET /api/places/search?keyword=...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is required" },
      { status: 400 }
    );
  }

  try {
    const predictions = await searchPlaces(keyword);

    // Map Google Places predictions to CitySearchItem
    const results: CitySearchItem[] = predictions.map((prediction) => {
      const secondaryText = prediction.structured_formatting.secondary_text;
      const countryCode = extractCountryCode(secondaryText);

      return {
        id: prediction.place_id,
        name: prediction.structured_formatting.main_text,
        region: secondaryText,
        countryCode: countryCode || "",
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Google Places API error:", error);
    return NextResponse.json(
      { error: "Failed to search Google Places" },
      { status: 500 }
    );
  }
}

/**
 * Extract country code from secondary text (e.g., "CA, USA" -> "US")
 */
function extractCountryCode(secondaryText: string): string {
  if (!secondaryText) return "";

  const parts = secondaryText.split(",").map((p) => p.trim());
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    if (lastPart.length === 2) {
      return lastPart.toUpperCase();
    }
  }

  return "";
}
