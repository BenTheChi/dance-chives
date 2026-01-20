import { NextRequest, NextResponse } from "next/server";
import { getEventSections } from "@/db/queries/event";
import { unstable_cache } from "next/cache";

// Force dynamic rendering since we use params
export const dynamic = 'force-dynamic';

// Revalidation time: 1 hour
export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 },
      );
    }

    // Use unstable_cache with tag for ISR
    const getCachedSections = unstable_cache(
      async (eventId: string) => {
        return await getEventSections(eventId);
      },
      [`watch-event-sections-${eventId}`],
      {
        revalidate: 3600, // 1 hour
        tags: ["watch-event-sections", `watch-event-${eventId}`],
      },
    );

    const sections = await getCachedSections(eventId);

    return NextResponse.json(sections, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error("Error fetching event sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 },
    );
  }
}
