/**
 * Job status manager for background processing using Postgres
 * Jobs expire after 1 hour to prevent database bloat
 */

import { randomUUID } from "crypto";
import { prisma } from "@/lib/primsa";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job<T = any> {
  id: string;
  status: JobStatus;
  createdAt: number;
  completedAt?: number;
  result?: T;
  error?: string;
}

const JOB_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Create a new job and return its ID
 * Note: Requires Prisma client to be regenerated after migration
 */
export async function createJob<T = any>(): Promise<string> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + JOB_EXPIRY_MS);

  await (prisma as any).job.create({
    data: {
      id,
      status: "pending",
      expiresAt,
    },
  });

  return id;
}

/**
 * Get a job by ID, returning undefined if not found or expired
 * Note: Requires Prisma client to be regenerated after migration
 */
export async function getJob<T = any>(id: string): Promise<Job<T> | undefined> {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "job-status-manager.ts:getJob:entry",
      message: "Fetching job from database",
      data: { jobId: id },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion
  const job = await (prisma as any).job.findUnique({
    where: { id },
  });

  if (!job) {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "job-status-manager.ts:getJob:notFound",
        message: "Job not found in database",
        data: { jobId: id },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    return undefined;
  }

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "job-status-manager.ts:getJob:found",
      message: "Job found in database",
      data: {
        jobId: job.id,
        status: job.status,
        hasResult: !!job.result,
        resultType: job.result ? typeof job.result : "none",
        resultIsString: job.result ? typeof job.result === "string" : false,
        resultStringified: job.result
          ? JSON.stringify(job.result).substring(0, 200)
          : "none",
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion

  // Check if expired
  if (new Date() > job.expiresAt) {
    // Delete expired job
    await (prisma as any).job.delete({ where: { id } }).catch(() => {
      // Ignore errors if job was already deleted
    });
    return undefined;
  }

  // Convert Prisma model to Job interface
  const converted = {
    id: job.id,
    status: job.status as JobStatus,
    createdAt: job.createdAt.getTime(),
    completedAt: job.completedAt?.getTime(),
    result: job.result as T | undefined,
    error: job.error || undefined,
  };
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "job-status-manager.ts:getJob:converted",
      message: "Job converted to interface",
      data: {
        jobId: converted.id,
        status: converted.status,
        hasResult: !!converted.result,
        resultType: converted.result ? typeof converted.result : "none",
        resultKeys:
          converted.result && typeof converted.result === "object"
            ? Object.keys(converted.result)
            : "not-object",
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion
  return converted;
}

/**
 * Update job status, optionally setting result or error
 * Note: Requires Prisma client to be regenerated after migration
 */
export async function updateJobStatus<T = any>(
  id: string,
  status: JobStatus,
  result?: T,
  error?: string
): Promise<boolean> {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "job-status-manager.ts:updateJobStatus:entry",
      message: "Updating job status",
      data: {
        jobId: id,
        status,
        hasResult: result !== undefined,
        resultType: result ? typeof result : "none",
        hasError: error !== undefined,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "E",
    }),
  }).catch(() => {});
  // #endregion
  try {
    const updateData: any = {
      status,
    };

    if (status === "completed" || status === "failed") {
      updateData.completedAt = new Date();
    }

    if (result !== undefined) {
      // Store result as JSON
      updateData.result = result;
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "job-status-manager.ts:updateJobStatus:beforeUpdate",
            message: "About to update job with result",
            data: {
              jobId: id,
              status,
              resultKeys:
                result && typeof result === "object"
                  ? Object.keys(result)
                  : "not-object",
              resultStringified: JSON.stringify(result).substring(0, 200),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "E",
          }),
        }
      ).catch(() => {});
      // #endregion
    }

    if (error !== undefined) {
      updateData.error = error;
    }

    const updated = await (prisma as any).job.update({
      where: { id },
      data: updateData,
    });
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "job-status-manager.ts:updateJobStatus:afterUpdate",
        message: "Job updated successfully",
        data: {
          jobId: id,
          status: updated.status,
          hasResult: !!updated.result,
          resultType: updated.result ? typeof updated.result : "none",
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "E",
      }),
    }).catch(() => {});
    // #endregion

    return true;
  } catch (error) {
    // Job might not exist
    console.error("Error updating job status:", error);
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "job-status-manager.ts:updateJobStatus:error",
        message: "Failed to update job status",
        data: {
          jobId: id,
          status,
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "E",
      }),
    }).catch(() => {});
    // #endregion
    return false;
  }
}

/**
 * Delete a job by ID
 * Note: Requires Prisma client to be regenerated after migration
 */
export async function deleteJob(id: string): Promise<boolean> {
  try {
    await (prisma as any).job.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    // Job might not exist
    return false;
  }
}

/**
 * Clean up expired jobs (should be called periodically)
 * Note: Requires Prisma client to be regenerated after migration
 */
export async function cleanupExpiredJobs(): Promise<number> {
  const now = new Date();
  const result = await (prisma as any).job.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });
  return result.count;
}
