"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/primsa";
import {
  CHANNEL_URL_ERROR_MESSAGES,
  parseYouTubeChannelUrl,
  type ParsedChannelRef,
} from "@/lib/submissions/youtube-channel-url";
import {
  ALREADY_KNOWN_MESSAGE,
  type ChannelSubmissionFormState,
} from "@/lib/submissions/channel-submission-state";

interface YouTubeChannelInfo {
  channelId: string;
  title: string;
  videoCount?: number;
}

/**
 * Rate limiting, ported from the playlist submission flow this replaces.
 *
 * Membership used to be the throttle. Without it, this is the only thing
 * between a public form and the YouTube quota the ingest pipeline depends on —
 * so the limit is checked BEFORE any API call, and a blocked request costs
 * nothing.
 *
 * The counter lives in process memory, which means it resets on cold start and
 * is not shared between serverless instances: a soft limit, not a hard one.
 * That was judged acceptable for the old flow against the same threat model —
 * a low-value target where the real gate is that nothing acts on a submission
 * until a human accepts it. If abuse ever materialises, this moves to a table.
 */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const ipSubmissionTimestamps = new Map<string, number[]>();

function getClientIp(allHeaders: Headers): string {
  const forwardedFor = allHeaders.get("x-forwarded-for");
  const firstIp = forwardedFor?.split(",")[0]?.trim();
  if (firstIp) return firstIp;

  return (
    allHeaders.get("x-real-ip")?.trim() ??
    allHeaders.get("cf-connecting-ip")?.trim() ??
    "unknown"
  );
}

function withinRateLimit(ip: string, nowMs: number): boolean {
  const recent = (ipSubmissionTimestamps.get(ip) ?? []).filter(
    (ts) => ts >= nowMs - RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    ipSubmissionTimestamps.set(ip, recent);
    return false;
  }

  recent.push(nowMs);
  ipSubmissionTimestamps.set(ip, recent);
  return true;
}

/**
 * Resolve a channel reference against the YouTube Data API.
 *
 * Returns null when the key is absent or the call fails. That is deliberate:
 * the submission is a lead, and losing the lead because a metadata lookup was
 * unavailable would be the worse failure. The echo-back degrades; the write
 * does not.
 */
async function resolveChannel(
  ref: ParsedChannelRef,
): Promise<YouTubeChannelInfo | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;

  // Every ref shape goes through `channels`: `id` and `forUsername` for the
  // older forms, `forHandle` for an @handle. That keeps the whole lookup at 1
  // quota unit — `search` would read a handle too, but costs 100, and this key
  // is shared with the ingest pipeline, whose sweep budget is the archive's
  // real ceiling. A public form must not be able to spend it.
  const endpoint = new URL("https://www.googleapis.com/youtube/v3/channels");
  endpoint.searchParams.set("part", "snippet,statistics");
  endpoint.searchParams.set("key", key);

  if (ref.kind === "id") {
    endpoint.searchParams.set("id", ref.value);
  } else if (ref.kind === "user") {
    endpoint.searchParams.set("forUsername", ref.value);
  } else {
    endpoint.searchParams.set("forHandle", ref.value.replace(/^@/, ""));
  }

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      items?: Array<{
        id?: string;
        snippet?: { title?: string };
        statistics?: { videoCount?: string };
      }>;
    };

    const item = data.items?.[0];
    if (!item?.id || !item.snippet?.title) return null;

    const videoCount = Number(item.statistics?.videoCount);

    return {
      channelId: item.id,
      title: item.snippet.title,
      videoCount: Number.isFinite(videoCount) ? videoCount : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Accept anyone's claim that a channel is worth archiving.
 *
 * Open to the public. The review status is the gate: a submission does nothing
 * until someone accepts it in the manager, where it becomes a *queued* backlog
 * row rather than a live channel — `channel_discovery_channel` has no proposed
 * state and `is_active` gates real ingest, so enrolling a channel stays a
 * human act. Membership was a second, redundant gate, and the members-only
 * version of this form produced zero submissions while it was live.
 */
export async function submitChannel(
  _previous: ChannelSubmissionFormState,
  formData: FormData,
): Promise<ChannelSubmissionFormState> {
  // Before the YouTube call, so a throttled request spends no quota.
  const ip = getClientIp(await headers());
  if (!withinRateLimit(ip, Date.now())) {
    return {
      status: "error",
      message: "That's a lot of submissions. Try again in a few minutes.",
    };
  }

  const rawInput = String(formData.get("channelUrl") ?? "");
  const parsed = parseYouTubeChannelUrl(rawInput);

  if (!parsed.ok || !parsed.ref) {
    return {
      status: "error",
      message: CHANNEL_URL_ERROR_MESSAGES[parsed.error ?? "unrecognized"],
    };
  }

  const ref = parsed.ref;
  const info = await resolveChannel(ref);

  // Is it already in the pipeline? Answered from the manager's own table so
  // the reply is true rather than reassuring. Matched on the YouTube channel
  // id when we have one, and on the url otherwise.
  const archivedRows = await prisma.$queryRaw<Array<{ channel_name: string }>>`
    SELECT channel_name
    FROM channel_discovery_channel
    WHERE channel_id = ${info?.channelId ?? ""}
       OR lower(channel_url) = lower(${ref.url})
    LIMIT 1
  `;
  const alreadyArchived = archivedRows.length > 0;

  // A channel a human already turned down does not come back into the queue.
  // With no membership wall anyone can re-submit indefinitely, so without this
  // one unwanted channel would generate review work forever. The submitter is
  // deliberately NOT told it was rejected — that invites argument and leaks an
  // editorial judgement — so this returns the same wording as any other
  // already-known channel.
  // findFirst rather than findUnique: the uniqueness of `youtubeChannelId` is
  // a PARTIAL index created in SQL (Prisma cannot express one), so the
  // generated client does not know the column is unique. The database still
  // enforces it — this is the read side agreeing with what Prisma can see.
  const existing = await prisma.channelSubmission.findFirst({
    where: info?.channelId
      ? { youtubeChannelId: info.channelId }
      : { channelUrl: ref.url },
  });

  if (existing?.status === "rejected") {
    return { status: "success", message: ALREADY_KNOWN_MESSAGE };
  }

  const shared = {
    channelUrl: ref.url,
    rawInput: rawInput.trim(),
    youtubeChannelId: info?.channelId,
    channelName: info?.title,
    videoCount: info?.videoCount,
    alreadyArchived,
    submitterIp: ip === "unknown" ? undefined : ip,
  };

  // Re-submitting the same channel is the same claim, not a new one — now
  // keyed on the channel rather than on a member, since there is no member.
  // An existing row is updated in place so a second submitter refreshes the
  // metadata instead of stacking a duplicate for review.
  if (existing) {
    await prisma.channelSubmission.update({
      where: { id: existing.id },
      data: shared,
    });
  } else {
    await prisma.channelSubmission.create({
      data: {
        ...shared,
        status: alreadyArchived ? "duplicate" : "pending",
      },
    });
  }

  const displayName = info?.title ?? archivedRows[0]?.channel_name ?? ref.value;

  if (alreadyArchived) {
    return {
      status: "success",
      message: `${displayName} is already being archived — thanks for checking.`,
      resolved: {
        name: displayName,
        videoCount: info?.videoCount,
        alreadyArchived: true,
      },
    };
  }

  return {
    status: "success",
    message: "Thank you — we'll take a look at this channel.",
    resolved: {
      name: displayName,
      videoCount: info?.videoCount,
      alreadyArchived: false,
    },
  };
}
