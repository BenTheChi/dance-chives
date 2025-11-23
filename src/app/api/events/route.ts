import { searchEvents } from "@/db/queries/event";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  try {
    const events = await searchEvents(keyword || undefined);

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error("Error searching events:", error);
    return NextResponse.json(
      { error: "Failed to search events" },
      { status: 500 }
    );
  }
}
