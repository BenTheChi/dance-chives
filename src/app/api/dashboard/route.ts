import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { getDashboardData } from "@/lib/server_actions/request_actions";

const CACHE_CONTROL = "max-age=60";

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    { requireAuth: true },
    async () => {
      try {
        const dashboardData = await getDashboardData();

        return NextResponse.json(dashboardData, {
          headers: { "Cache-Control": CACHE_CONTROL },
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return NextResponse.json(
          { error: "Failed to fetch dashboard data" },
          { status: 500 }
        );
      }
    }
  );
}

