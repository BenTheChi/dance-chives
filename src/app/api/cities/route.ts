import { NextRequest, NextResponse } from "next/server";
import { getAllCities } from "@/db/queries/event";

export async function GET(request: NextRequest) {
  try {
    const cities = await getAllCities();
    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
