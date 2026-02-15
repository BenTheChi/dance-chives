"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/primsa";
import {
  CanonicalInstagramPostUrl,
  canonicalizeInstagramPostOrReelUrl,
} from "@/lib/submissions/instagram-url";
import type { SubmissionFormState } from "@/lib/submissions/submission-form-state";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_MESSAGE = "Rate limit hit. Try again in 10 minutes.";
const HIDDEN_DUPLICATE_MESSAGE = "Submission could not be accepted.";

const ipSubmissionTimestamps = new Map<string, number[]>();

type EventCardDuplicateRecord = { eventId: string; status: string };
type SubmissionDuplicateRecord = { id: string; status: string };

type EventCardDelegate = {
  findFirst(args: unknown): Promise<EventCardDuplicateRecord | null>;
};

type SubmissionDelegate = {
  findFirst(args: unknown): Promise<SubmissionDuplicateRecord | null>;
  create(args: {
    data: {
      status: "waiting";
      email: string | null;
      igPostUrl: string | null;
      blob: string | null;
    };
  }): Promise<unknown>;
};

const prismaSubmission = prisma as unknown as {
  eventCard: EventCardDelegate;
  submission: SubmissionDelegate;
};

function getClientIpFromHeaders(allHeaders: Headers): string {
  const forwardedFor = allHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = allHeaders.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const cfIp = allHeaders.get("cf-connecting-ip")?.trim();
  if (cfIp) {
    return cfIp;
  }

  return "unknown";
}

function checkRateLimit(ip: string, nowMs: number) {
  const existing = ipSubmissionTimestamps.get(ip) ?? [];
  const windowStart = nowMs - RATE_LIMIT_WINDOW_MS;
  const recent = existing.filter((ts) => ts >= windowStart);

  if (recent.length >= RATE_LIMIT_MAX) {
    ipSubmissionTimestamps.set(ip, recent);
    const oldestTimestamp = recent[0] ?? nowMs;
    const retryAfterMs = Math.max(
      0,
      oldestTimestamp + RATE_LIMIT_WINDOW_MS - nowMs
    );

    return {
      allowed: false,
      recentCount: recent.length,
      retryAfterMs,
    };
  }

  recent.push(nowMs);
  ipSubmissionTimestamps.set(ip, recent);

  return {
    allowed: true,
    recentCount: recent.length,
    retryAfterMs: 0,
  };
}

function getSubmissionStatusMessage(status: string): string {
  switch (status) {
    case "waiting":
      return "That Instagram post is already waiting for review.";
    case "reviewing":
      return "That Instagram post is currently being reviewed.";
    case "approved":
      return "That Instagram post has already been approved.";
    case "rejected":
      return "That Instagram post has already been reviewed.";
    default:
      return "That Instagram post has already been submitted.";
  }
}

function buildIgDedupeWhere(
  canonical: CanonicalInstagramPostUrl,
  fieldName: "ig" | "igPostUrl",
): unknown {
  const hosts = ["www.instagram.com", "instagram.com", "m.instagram.com"];
  const schemes = ["https", "http"];
  const exactForms = new Set<string>();

  for (const scheme of schemes) {
    for (const host of hosts) {
      const baseNoSlash = `${scheme}://${host}/${canonical.kind}/${canonical.shortcode}`;
      exactForms.add(baseNoSlash);
      exactForms.add(`${baseNoSlash}/`);
    }
  }

  const whereClauses = Array.from(exactForms).flatMap((url) => [
    { [fieldName]: url },
    { [fieldName]: { startsWith: `${url}?` } },
    { [fieldName]: { startsWith: `${url}#` } },
  ]);

  return { OR: whereClauses };
}

export async function submitHomepageSubmission(
  _prevState: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  try {
    const requestHeaders = await headers();
    const ip = getClientIpFromHeaders(requestHeaders);

    let normalizedIgUrl: string | null = null;
    const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
    const blob = String(formData.get("blob") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!instagramUrl && !blob) {
      return {
        status: "error",
        message: "Please include an Instagram URL, text details, or both.",
      };
    }

    const rateLimit = checkRateLimit(ip, Date.now());

    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: RATE_LIMIT_MESSAGE,
      };
    }

    if (instagramUrl) {
      const canonical = canonicalizeInstagramPostOrReelUrl(instagramUrl);
      if (!canonical) {
        return {
          status: "error",
          message:
            "Please provide a valid Instagram post or reel URL (instagram.com/p/... or instagram.com/reel/...).",
        };
      }

      normalizedIgUrl = canonical.canonicalUrl;

      const eventCardDedupeWhere = buildIgDedupeWhere(canonical, "ig");
      const submissionDedupeWhere = buildIgDedupeWhere(canonical, "igPostUrl");

      const eventCardMatch = await prismaSubmission.eventCard.findFirst({
        where: eventCardDedupeWhere,
        select: { eventId: true, status: true },
      });

      if (eventCardMatch) {
        const isHidden = eventCardMatch.status !== "visible";

        return {
          status: "error",
          message: isHidden
            ? HIDDEN_DUPLICATE_MESSAGE
            : "That Instagram post is already in Dance Chives.",
        };
      }

      const submissionMatch = await prismaSubmission.submission.findFirst({
        where: submissionDedupeWhere,
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true },
      });

      if (submissionMatch) {
        return {
          status: "error",
          message: getSubmissionStatusMessage(submissionMatch.status),
        };
      }
    }

    await prismaSubmission.submission.create({
      data: {
        status: "waiting",
        email: email || null,
        igPostUrl: normalizedIgUrl,
        blob: blob || null,
      },
    });

    return {
      status: "success",
      message: "Thanks. Your submission was received.",
    };
  } catch (error) {
    console.error("[submission] request_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}
