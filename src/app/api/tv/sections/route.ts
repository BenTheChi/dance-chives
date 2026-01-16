import { NextRequest, NextResponse } from "next/server";
import { getAllBattleSections } from "@/db/queries/event";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const sections = await getAllBattleSections(limit, offset);

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching battle sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}
