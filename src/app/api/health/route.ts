import { NextResponse } from "next/server";
import { getOverallHealth } from "@/lib/health-check";
import { getEnvironmentInfo } from "@/lib/config";

export async function GET() {
  try {
    const [healthStatus, envInfo] = await Promise.all([
      getOverallHealth(),
      Promise.resolve(getEnvironmentInfo()),
    ]);

    const response = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      health: healthStatus,
    };

    // Return appropriate HTTP status based on health
    const statusCode =
      healthStatus.status === "healthy"
        ? 200
        : healthStatus.status === "degraded"
        ? 207
        : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
