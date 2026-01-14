import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { getJob } from "@/lib/job-status-manager";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  return withApiAuth(
    request,
    { minAuthLevel: AUTH_LEVELS.SUPER_ADMIN },
    async () => {
      try {
        const { jobId } = await context.params;

        if (!jobId) {
          return NextResponse.json(
            { error: "Job ID is required" },
            { status: 400 }
          );
        }

        const job = await getJob(jobId);

        if (!job) {
          return NextResponse.json(
            { error: "Job not found or expired" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          jobId: job.id,
          status: job.status,
          result: job.result,
          error: job.error,
        });
      } catch (error) {
        console.error("Error fetching job status:", error);
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch job status",
          },
          { status: 500 }
        );
      }
    }
  );
}

