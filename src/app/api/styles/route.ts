import { NextRequest, NextResponse } from "next/server";
import { getAllStyles } from "@/db/queries/event";

export async function GET(request: NextRequest) {
  try {
    const styles = await getAllStyles();
    return NextResponse.json({ styles });
  } catch (error) {
    console.error("Error fetching styles:", error);
    return NextResponse.json(
      { error: "Failed to fetch styles" },
      { status: 500 }
    );
  }
}
