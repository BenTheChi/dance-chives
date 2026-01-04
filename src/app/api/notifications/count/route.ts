import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { prisma } from "@/lib/primsa";

const CACHE_CONTROL = "max-age=30";

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    { requireAuth: true },
    async (_request, session) => {
      try {
        const count = await prisma.notification.count({
          where: {
            userId: session.user.id,
            isOld: false,
          },
        });

        return NextResponse.json(
          { count },
          { headers: { "Cache-Control": CACHE_CONTROL } }
        );
      } catch (error) {
        console.error("Error fetching notification count:", error);
        return NextResponse.json(
          { error: "Failed to fetch notification count" },
          { status: 500 }
        );
      }
    }
  );
}

