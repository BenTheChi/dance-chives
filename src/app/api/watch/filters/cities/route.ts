import { NextResponse } from "next/server";
import { getCitiesWithEvents } from "@/db/queries/event";

const CACHE_CONTROL_HEADER =
  "public, s-maxage=86400, stale-while-revalidate=86400";

export async function GET() {
  try {
    const cities = await getCitiesWithEvents();
    return NextResponse.json(cities, {
      headers: {
        "Cache-Control": CACHE_CONTROL_HEADER,
      },
    });
  } catch (error) {
    console.error("Error fetching watch filter cities:", error);
    return NextResponse.json(
      { error: "Failed to load cities" },
      { status: 500 }
    );
  }
}
