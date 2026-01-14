import { useEffect, useRef, useCallback } from "react";

interface UseJobPollingOptions<T> {
  jobId: string | null;
  statusEndpoint: string;
  onComplete: (result: T) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
  enabled?: boolean;
}

/**
 * Custom hook for polling job status
 * Handles polling, cleanup, and state management
 */
export function useJobPolling<T = any>({
  jobId,
  statusEndpoint,
  onComplete,
  onError,
  pollInterval = 2000,
  enabled = true,
}: UseJobPollingOptions<T>) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Keep refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId || !enabled) {
      stopPolling();
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`${statusEndpoint}/${jobId}`);

        if (!response.ok) {
          throw new Error("Failed to check job status");
        }

        const data = await response.json();
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "useJobPolling.ts:pollStatus:response",
              message: "Received polling response",
              data: {
                jobId,
                status: data.status,
                statusType: typeof data.status,
                statusString: JSON.stringify(data.status),
                hasResult: !!data.result,
                resultType: data.result ? typeof data.result : "none",
                statusEqualsCompleted: data.status === "completed",
                statusEqualsCompletedString: data.status === "completed",
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "B",
            }),
          }
        ).catch(() => {});
        // #endregion
        console.log("Polling job status:", {
          jobId,
          status: data.status,
          hasResult: !!data.result,
        });

        if (data.status === "completed") {
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "useJobPolling.ts:pollStatus:completed",
                message: "Job status is completed, about to call onComplete",
                data: {
                  jobId,
                  hasResult: !!data.result,
                  resultType: data.result ? typeof data.result : "none",
                  hasOnComplete: !!onCompleteRef.current,
                },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "C",
              }),
            }
          ).catch(() => {});
          // #endregion
          stopPolling();
          console.log(
            "Job completed, calling onComplete with result:",
            data.result
          );
          if (onCompleteRef.current) {
            // Always call onComplete when status is completed
            // The callback should handle the result (even if undefined)
            // #region agent log
            fetch(
              "http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  location: "useJobPolling.ts:pollStatus:callingOnComplete",
                  message: "Calling onComplete callback",
                  data: {
                    jobId,
                    hasResult: !!data.result,
                    resultKeys:
                      data.result && typeof data.result === "object"
                        ? Object.keys(data.result)
                        : "not-object",
                  },
                  timestamp: Date.now(),
                  sessionId: "debug-session",
                  runId: "run1",
                  hypothesisId: "C",
                }),
              }
            ).catch(() => {});
            // #endregion
            onCompleteRef.current(data.result);
          } else {
            console.warn("onComplete callback is not set");
            // #region agent log
            fetch(
              "http://127.0.0.1:7242/ingest/86904eb6-df20-46c7-84a5-549593548028",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  location: "useJobPolling.ts:pollStatus:noOnComplete",
                  message: "onComplete callback is not set",
                  data: { jobId },
                  timestamp: Date.now(),
                  sessionId: "debug-session",
                  runId: "run1",
                  hypothesisId: "C",
                }),
              }
            ).catch(() => {});
            // #endregion
          }
        } else if (data.status === "failed") {
          stopPolling();
          const errorMessage = data.error || "Job failed";
          console.log("Job failed:", errorMessage);
          if (onErrorRef.current) {
            onErrorRef.current(errorMessage);
          }
        }
        // If status is "pending" or "processing", continue polling
      } catch (error) {
        console.error("Error polling job status:", error);
        // Continue polling on error (might be transient)
      }
    };

    // Poll immediately, then set up interval
    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, pollInterval);

    return () => {
      stopPolling();
    };
  }, [jobId, statusEndpoint, pollInterval, enabled, stopPolling]);

  return { stopPolling };
}
