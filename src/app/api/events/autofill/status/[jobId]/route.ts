import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJob } from "@/lib/job-status-manager";

export async function GET(
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'autofill/status/route.ts:jobNotFound',message:'Job not found in status endpoint',data:{jobId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: "Job not found or expired" },
        { status: 404 }
      );
    }

    const response = {
      jobId: job.id,
      status: job.status,
      result: job.result,
      error: job.error,
    };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'autofill/status/route.ts:returningResponse',message:'Returning job status response',data:{jobId:job.id,status:job.status,hasResult:!!job.result,resultType:job.result?typeof job.result:'none',resultKeys:job.result&&typeof job.result==='object'?Object.keys(job.result):'not-object',statusString:JSON.stringify(job.status)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Log for debugging
    if (job.status === "completed") {
      console.log("Autofill job completed, returning result:", JSON.stringify(job.result, null, 2));
    }

    return NextResponse.json(response);
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

