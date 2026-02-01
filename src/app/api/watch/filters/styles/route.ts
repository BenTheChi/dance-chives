import { NextResponse } from "next/server";
import { getFilterOptionsFromEvents } from "@/db/queries/event";

const CACHE_CONTROL_HEADER =
  "public, s-maxage=86400, stale-while-revalidate=86400";

export async function GET() {
  try {
    const { styles } = await getFilterOptionsFromEvents();
    return NextResponse.json(styles, {
      headers: {
        "Cache-Control": CACHE_CONTROL_HEADER,
      },
    });
  } catch (error) {
    console.error("Error fetching watch filter styles:", error);
    return NextResponse.json(
      { error: "Failed to load styles" },
      { status: 500 },
    );
  }
}
