import { NextRequest, NextResponse } from "next/server";
import { searchCitiesInNeo4j } from "@/db/queries/event";
import { searchCitiesInPostgres } from "@/db/queries/city";
import { searchPlaces, getPlaceDetails } from "@/lib/google-places";
import { CitySearchItem } from "@/types/city";
import { cityReadSource, cityShadowCompare } from "@/lib/config";

/**
 * Search cities from configured read source, optionally Google Places
 * GET /api/cities/search?keyword=...&includeGoogle=true
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");
  const includeGoogle = searchParams.get("includeGoogle") === "true";

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is required" },
      { status: 400 }
    );
  }

  try {
    const primaryResults =
      cityReadSource === "postgres"
        ? await searchCitiesInPostgres(keyword)
        : await searchCitiesInNeo4j(keyword);

    const neo4jResults =
      cityReadSource === "neo4j"
        ? primaryResults
        : cityShadowCompare
          ? await searchCitiesInNeo4j(keyword)
          : [];

    const postgresResults =
      cityReadSource === "postgres"
        ? primaryResults
        : cityShadowCompare
          ? await searchCitiesInPostgres(keyword)
          : [];

    if (cityShadowCompare) {
      const neo4jIds = new Set(neo4jResults.map((city) => city.id));
      const postgresIds = new Set(postgresResults.map((city) => city.id));
      const onlyInNeo4j = [...neo4jIds].filter((id) => !postgresIds.has(id));
      const onlyInPostgres = [...postgresIds].filter((id) => !neo4jIds.has(id));

      if (onlyInNeo4j.length > 0 || onlyInPostgres.length > 0) {
        console.warn("[CITY_SHADOW_COMPARE] search parity mismatch", {
          keyword,
          onlyInNeo4j,
          onlyInPostgres,
        });
      }
    }

    // Convert to CitySearchItem format
    const fromPrimary: CitySearchItem[] = primaryResults.map((city) => ({
      id: city.id,
      name: city.name,
      region: city.region,
      countryCode: city.countryCode,
    }));

    let fromGoogle: CitySearchItem[] = [];

    // Only search Google Places if:
    // 1. Primary source returned 0 results (auto-search), OR
    // 2. includeGoogle=true (explicit request)
    if (primaryResults.length === 0 || includeGoogle) {
      try {
        const googlePredictions = await searchPlaces(keyword);

        // Map Google Places predictions to CitySearchItem
        // Fetch place details for any that don't have country codes
        fromGoogle = await Promise.all(
          googlePredictions.map(async (prediction) => {
            const secondaryText =
              prediction.structured_formatting.secondary_text;
            let countryCode = extractCountryCode(secondaryText);

            // If we couldn't extract country code, fetch place details
            if (!countryCode || countryCode.trim() === "") {
              try {
                const placeDetails = await getPlaceDetails(prediction.place_id);
                const countryComponent = placeDetails.address_components.find(
                  (ac) => ac.types.includes("country")
                );
                if (countryComponent) {
                  countryCode = countryComponent.short_name;
                }
              } catch (error) {
                console.error(
                  `Error fetching place details for ${prediction.place_id}:`,
                  error
                );
                // Continue with empty country code if fetch fails
              }
            }

            return {
              id: prediction.place_id,
              name: prediction.structured_formatting.main_text,
              region: secondaryText,
              countryCode: countryCode || "",
            };
          })
        );
      } catch (error) {
        console.error("Error searching Google Places:", error);
        // Continue with Neo4j results only if Google Places fails
      }
    }

    // Merge and deduplicate results (prioritize Neo4j results)
    const allResults = [...fromPrimary];
    const primaryIds = new Set(fromPrimary.map((c) => c.id));

    // Add Google results that aren't already in primary source
    for (const googleCity of fromGoogle) {
      if (!primaryIds.has(googleCity.id)) {
        allResults.push(googleCity);
      }
    }

    return NextResponse.json({
      results: allResults,
      fromPrimary,
      fromNeo4j:
        cityReadSource === "neo4j" || cityShadowCompare
          ? neo4jResults.map((city) => ({
              id: city.id,
              name: city.name,
              region: city.region,
              countryCode: city.countryCode,
            }))
          : undefined,
      fromPostgres:
        cityReadSource === "postgres" || cityShadowCompare
          ? postgresResults.map((city) => ({
              id: city.id,
              name: city.name,
              region: city.region,
              countryCode: city.countryCode,
            }))
          : undefined,
      readSource: cityReadSource,
      fromGoogle:
        includeGoogle || primaryResults.length === 0 ? fromGoogle : undefined,
      hasMore: fromGoogle.length > 0 && primaryResults.length > 0,
    });
  } catch (error) {
    console.error("Error searching cities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Extract country code from secondary text (e.g., "CA, USA" -> "US")
 * This is a simple heuristic - may need improvement
 */
function extractCountryCode(secondaryText: string): string {
  if (!secondaryText) return "";

  // Try to extract from common patterns
  const parts = secondaryText.split(",").map((p) => p.trim());
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    // If it's a 2-letter code, return it
    if (lastPart.length === 2) {
      return lastPart.toUpperCase();
    }
  }

  return "";
}
