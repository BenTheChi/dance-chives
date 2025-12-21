import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents } from "@/db/queries/event";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const citySlug = searchParams.get("city");
  const style = searchParams.get("style");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!citySlug) {
    return NextResponse.json({ events: [] }, { status: 200 });
  }

  try {
    const events = await getCalendarEvents(
      citySlug,
      style || undefined,
      startDate || undefined,
      endDate || undefined
    );
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

