import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/primsa";
import { formatInTimeZone } from "date-fns-tz";
import { Prisma } from "@prisma/client";

type CursorType = "future" | "past";

function parseLimit(value: string | null): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.min(100, Math.floor(n));
}

function parseCursorType(value: string | null): CursorType {
  return value === "past" ? "past" : "future";
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateOnlyForEventTimezone(nowUtc: Date, timeZone: string): Date {
  // Convert nowUtc into an ISO calendar day in the event timezone, then convert to a Date.
  const iso = formatInTimeZone(nowUtc, timeZone, "yyyy-MM-dd");
  return new Date(`${iso}T00:00:00.000Z`);
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await ctx.params;
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const cursorType = parseCursorType(
      request.nextUrl.searchParams.get("cursorType")
    );
    const cursorStartUtc = parseDate(
      request.nextUrl.searchParams.get("cursorStartUtc")
    );
    const cursorId = request.nextUrl.searchParams.get("cursorId") || null;

    const eventCard = await prisma.eventCard.findUnique({ where: { eventId } });
    const eventTimezone = eventCard?.eventTimezone || "UTC";
    const nowUtc = new Date();
    const todayLocalDate = dateOnlyForEventTimezone(nowUtc, eventTimezone);

    const futureBaseWhere: Prisma.EventDateWhereInput = {
      eventId,
      OR: [
        { kind: "allDay" as const, localDate: { gte: todayLocalDate } },
        { kind: "timed" as const, startUtc: { gte: nowUtc } },
      ],
    };

    const pastBaseWhere: Prisma.EventDateWhereInput = {
      eventId,
      OR: [
        { kind: "allDay" as const, localDate: { lt: todayLocalDate } },
        { kind: "timed" as const, startUtc: { lt: nowUtc } },
      ],
    };

    const items: Array<{
      id: string;
      kind: "timed" | "allDay";
      startUtc: string;
      endUtc: string | null;
      localDate: string | null;
    }> = [];

    let nextCursorType: CursorType | null = null;
    let nextCursorStartUtc: string | null = null;
    let nextCursorId: string | null = null;
    let hasMore = false;

    if (cursorType === "future") {
      const futureWhere: Prisma.EventDateWhereInput =
        cursorStartUtc && cursorId
          ? {
              ...futureBaseWhere,
              AND: [
                {
                  OR: [
                    { startUtc: { gt: cursorStartUtc } },
                    { startUtc: cursorStartUtc, id: { gt: cursorId } },
                  ],
                },
              ],
            }
          : futureBaseWhere;

      const future = await prisma.eventDate.findMany({
        where: futureWhere,
        orderBy: [{ startUtc: "asc" }, { id: "asc" }],
        take: limit,
      });

      for (const r of future) {
        items.push({
          id: r.id,
          kind: r.kind,
          startUtc: r.startUtc.toISOString(),
          endUtc: r.endUtc ? r.endUtc.toISOString() : null,
          localDate: r.localDate
            ? r.localDate.toISOString().slice(0, 10)
            : null,
        });
      }

      if (items.length < limit) {
        const remaining = limit - items.length;
        const past = await prisma.eventDate.findMany({
          where: pastBaseWhere,
          orderBy: [{ startUtc: "desc" }, { id: "desc" }],
          take: remaining,
        });
        for (const r of past) {
          items.push({
            id: r.id,
            kind: r.kind,
            startUtc: r.startUtc.toISOString(),
            endUtc: r.endUtc ? r.endUtc.toISOString() : null,
            localDate: r.localDate
              ? r.localDate.toISOString().slice(0, 10)
              : null,
          });
        }

        // Cursor moves to past if we included any past rows.
        if (past.length > 0) {
          const last = past[past.length - 1];
          nextCursorType = "past";
          nextCursorStartUtc = last.startUtc.toISOString();
          nextCursorId = last.id;

          const morePast = await prisma.eventDate.findFirst({
            where: {
              ...pastBaseWhere,
              AND: [
                {
                  OR: [
                    { startUtc: { lt: last.startUtc } },
                    { startUtc: last.startUtc, id: { lt: last.id } },
                  ],
                },
              ],
            },
            orderBy: [{ startUtc: "desc" }, { id: "desc" }],
            select: { id: true },
          });
          hasMore = Boolean(morePast);
        } else if (future.length > 0) {
          // Only future rows returned, but fewer than limit → no past rows exist.
          hasMore = false;
          nextCursorType = null;
        } else {
          hasMore = false;
          nextCursorType = null;
        }
      } else {
        // More future likely
        const last = future[future.length - 1];
        nextCursorType = "future";
        nextCursorStartUtc = last.startUtc.toISOString();
        nextCursorId = last.id;

        const moreFuture = await prisma.eventDate.findFirst({
          where: {
            ...futureBaseWhere,
            AND: [
              {
                OR: [
                  { startUtc: { gt: last.startUtc } },
                  { startUtc: last.startUtc, id: { gt: last.id } },
                ],
              },
            ],
          },
          orderBy: [{ startUtc: "asc" }, { id: "asc" }],
          select: { id: true },
        });
        hasMore = Boolean(moreFuture);
      }
    } else {
      const pastWhere: Prisma.EventDateWhereInput =
        cursorStartUtc && cursorId
          ? {
              ...pastBaseWhere,
              AND: [
                {
                  OR: [
                    { startUtc: { lt: cursorStartUtc } },
                    { startUtc: cursorStartUtc, id: { lt: cursorId } },
                  ],
                },
              ],
            }
          : pastBaseWhere;

      const past = await prisma.eventDate.findMany({
        where: pastWhere,
        orderBy: [{ startUtc: "desc" }, { id: "desc" }],
        take: limit,
      });

      for (const r of past) {
        items.push({
          id: r.id,
          kind: r.kind,
          startUtc: r.startUtc.toISOString(),
          endUtc: r.endUtc ? r.endUtc.toISOString() : null,
          localDate: r.localDate
            ? r.localDate.toISOString().slice(0, 10)
            : null,
        });
      }

      if (past.length > 0) {
        const last = past[past.length - 1];
        nextCursorType = "past";
        nextCursorStartUtc = last.startUtc.toISOString();
        nextCursorId = last.id;

        const morePast = await prisma.eventDate.findFirst({
          where: {
            ...pastBaseWhere,
            AND: [
              {
                OR: [
                  { startUtc: { lt: last.startUtc } },
                  { startUtc: last.startUtc, id: { lt: last.id } },
                ],
              },
            ],
          },
          orderBy: [{ startUtc: "desc" }, { id: "desc" }],
          select: { id: true },
        });
        hasMore = Boolean(morePast);
      } else {
        hasMore = false;
        nextCursorType = null;
      }
    }

    return NextResponse.json({
      eventId,
      eventTimezone,
      items,
      nextCursor: nextCursorType
        ? {
            cursorType: nextCursorType,
            cursorStartUtc: nextCursorStartUtc,
            cursorId: nextCursorId,
          }
        : null,
      hasMore,
    });
  } catch (error) {
    console.error("Failed to load event dates:", error);
    return NextResponse.json(
      { message: "Failed to load event dates" },
      { status: 500 }
    );
  }
}
