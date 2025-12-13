import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/primsa";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await ctx.params;

    const eventCard = await prisma.eventCard.findUnique({ where: { eventId } });
    const eventTimezone = eventCard?.eventTimezone || "UTC";

    const dates = await prisma.eventDate.findMany({
      where: { eventId },
      orderBy: [{ startUtc: "asc" }, { id: "asc" }],
    });

    const items = dates.map((r) => ({
      id: r.id,
      kind: r.kind,
      startUtc: r.startUtc.toISOString(),
      endUtc: r.endUtc ? r.endUtc.toISOString() : null,
      localDate: r.localDate ? r.localDate.toISOString().slice(0, 10) : null,
    }));

    return NextResponse.json({
      eventId,
      eventTimezone,
      items,
    });
  } catch (error) {
    console.error("Failed to load event dates:", error);
    return NextResponse.json(
      { message: "Failed to load event dates" },
      { status: 500 }
    );
  }
}
