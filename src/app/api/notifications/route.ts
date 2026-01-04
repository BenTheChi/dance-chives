import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { prisma } from "@/lib/primsa";

const CACHE_CONTROL = "max-age=30";

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    { requireAuth: true },
    async (request, session) => {
      try {
        const url = new URL(request.url);
        const limitParam = url.searchParams.get("limit");
        const requestedLimit = parseInt(limitParam || "50", 10);
        const limit = Number.isNaN(requestedLimit) ? 50 : requestedLimit;
        const isOldParam = url.searchParams.get("isOld");
        let isOld: boolean | undefined;

        if (isOldParam === "true") {
          isOld = true;
        } else if (isOldParam === "false") {
          isOld = false;
        }

        const where: { userId: string; isOld?: boolean } = {
          userId: session.user.id,
        };
        if (isOld !== undefined) {
          where.isOld = isOld;
        }

        const notifications = await prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        return NextResponse.json(notifications, {
          headers: { "Cache-Control": CACHE_CONTROL },
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
          { error: "Failed to fetch notifications" },
          { status: 500 }
        );
      }
    }
  );
}

