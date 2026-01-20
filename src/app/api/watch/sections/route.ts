import { NextRequest, NextResponse } from "next/server";
import { getAllBattleSections } from "@/db/queries/event";
import { unstable_cache } from "next/cache";

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

// Revalidation time: 1 hour
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Use unstable_cache with tag for ISR
    const getCachedSections = unstable_cache(
      async (limit: number, offset: number) => {
        return await getAllBattleSections(limit, offset);
      },
      [`watch-sections-${limit}-${offset}`],
      {
        revalidate: 3600, // 1 hour
        tags: ["watch-sections"],
      }
    );

    const sections = await getCachedSections(limit, offset);

    return NextResponse.json(sections, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error("Error fetching battle sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}
