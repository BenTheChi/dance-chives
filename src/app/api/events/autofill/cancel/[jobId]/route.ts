import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJob, updateJobStatus } from "@/lib/job-status-manager";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Only allow canceling pending or processing jobs
    if (job.status === "completed" || job.status === "failed") {
      return NextResponse.json(
        { error: "Cannot cancel a job that is already completed or failed" },
        { status: 400 }
      );
    }

    // Update job status to failed with cancellation message
    await updateJobStatus(jobId, "failed", undefined, "Job cancelled by user");

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling autofill job:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel autofill job",
      },
      { status: 500 }
    );
  }
}
