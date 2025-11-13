import { searchAccessibleEvents } from "@/db/queries/event";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/primsa";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  try {
    // Get user's auth level
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { auth: true },
    });

    const authLevel = user?.auth ?? 0;

    const events = await searchAccessibleEvents(
      session.user.id,
      authLevel,
      keyword || undefined
    );

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error("Error searching accessible events:", error);
    return NextResponse.json(
      { error: "Failed to search events" },
      { status: 500 }
    );
  }
}

