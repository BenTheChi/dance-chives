import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { getSavedEventsForUser as getSavedEventsForUserQuery } from "@/db/queries/event";
import { prisma } from "@/lib/primsa";

const CACHE_CONTROL = "max-age=300";

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    { requireAuth: true },
    async (_request, session) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { auth: true },
        });
        const authLevel = user?.auth ?? 0;

        const savedEvents = await getSavedEventsForUserQuery(
          session.user.id,
          authLevel
        );

        return NextResponse.json(savedEvents, {
          headers: { "Cache-Control": CACHE_CONTROL },
        });
      } catch (error) {
        console.error("Error fetching saved events list:", error);
        return NextResponse.json(
          { error: "Failed to fetch saved events" },
          { status: 500 }
        );
      }
    }
  );
}

