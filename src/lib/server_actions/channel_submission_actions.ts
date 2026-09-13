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
 * What happened to one submitted channel.
 *
 * `known` covers already-queued and previously-rejected alike: the submitter
 * is told the same thing either way, since telling a stranger their suggestion
 * was turned down invites argument and leaks an editorial judgement.
 */
type SubmissionOutcome = {
  kind: "recorded" | "archived" | "known";
  name?: string;
  videoCount?: number;
};

/**
 * Resolve, dedupe and record one channel.
 *
 * The single and bulk paths share this so they cannot drift: a channel that is
 * a duplicate when submitted alone must be a duplicate when submitted in a
 * list of fifty.
 */
async function recordSubmission(
  ref: ParsedChannelRef,
  rawInput: string,
  ip: string,
): Promise<SubmissionOutcome> {
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
  // one unwanted channel would generate review work forever.
  //
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
    return { kind: "known" };
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

  // Re-submitting the same channel is the same claim, not a new one — keyed on
  // the channel rather than on a member, since there is no member. An existing
  // row is updated in place so a second submitter refreshes the metadata
  // instead of stacking a duplicate for review.
  if (existing) {
    await prisma.channelSubmission.update({
      where: { id: existing.id },
      data: shared,
    });
  } else {
    await prisma.channelSubmission.create({
      data: { ...shared, status: alreadyArchived ? "duplicate" : "pending" },
    });
  }

  const name = info?.title ?? archivedRows[0]?.channel_name;

  return {
    kind: alreadyArchived ? "archived" : "recorded",
    name,
    videoCount: info?.videoCount,
  };
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
  const outcome = await recordSubmission(ref, rawInput, ip);

  if (outcome.kind === "known") {
    return { status: "success", message: ALREADY_KNOWN_MESSAGE };
  }

  const displayName = outcome.name ?? ref.value;

  if (outcome.kind === "archived") {
    return {
      status: "success",
      message: `${displayName} is already being archived — thanks for checking.`,
      resolved: {
        name: displayName,
        videoCount: outcome.videoCount,
        alreadyArchived: true,
      },
    };
  }

  return {
    status: "success",
    message: "Thank you — we'll take a look at this channel.",
    resolved: {
      name: displayName,
      videoCount: outcome.videoCount,
      alreadyArchived: false,
    },
  };
}

/**
 * Lines accepted in one bulk paste.
 *
 * Not a quota limit — the manager resolves 50 ids in a single call for one
 * unit — but this form resolves one at a time, so each line is a unit against
 * the budget the ingest pipeline depends on. Combined with the IP rate limit
 * (5 pastes per 10 minutes) that caps a single submitter at 1,000 units of the
 * 10,000/day budget, which is a real ceiling rather than a comfortable one.
 */
const MAX_BULK_LINES = 20;

/**
 * Accept a pasted list of channels.
 *
 * Deduping is automatic and reported: the counts answer "how many were
 * actually added", which is the question someone pasting fifty lines is
 * asking. A large review queue is the intended outcome of this feature, not a
 * failure of it — the queue is where volume is meant to accumulate.
 *
 * Every line goes through the same recordSubmission as a single submission, so
 * the two paths cannot dedupe differently.
 */
export async function submitChannels(
  _previous: ChannelSubmissionFormState,
  formData: FormData,
): Promise<ChannelSubmissionFormState> {
  const ip = getClientIp(await headers());
  if (!withinRateLimit(ip, Date.now())) {
    return {
      status: "error",
      message: "That's a lot of submissions. Try again in a few minutes.",
    };
  }

  const rawInput = String(formData.get("channels") ?? "");

  // Commas AND newlines: a list off a spreadsheet uses one, a list out of a
  // chat message uses the other, and a hand-typed list uses both.
  const lines = rawInput
    .split(/[\s,]+/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (lines.length === 0) {
    return { status: "error", message: "Paste at least one channel URL." };
  }

  if (lines.length > MAX_BULK_LINES) {
    return {
      status: "error",
      message: `That's ${lines.length} channels — please paste at most ${MAX_BULK_LINES} at a time.`,
    };
  }

  let added = 0;
  let known = 0;
  let unreadable = 0;
  const seen = new Set<string>();

  for (const line of lines) {
    const parsed = parseYouTubeChannelUrl(line);

    if (!parsed.ok || !parsed.ref) {
      unreadable += 1;
      continue;
    }

    // The same channel written three ways in one paste is one claim. Caught
    // here rather than by the database so the count reported back is honest
    // about what the paste contained. Case is not a factor: the parser folds
    // handles, so `@Name` and `@name` produce one url.
    if (seen.has(parsed.ref.url)) {
      continue;
    }
    seen.add(parsed.ref.url);

    const outcome = await recordSubmission(parsed.ref, line, ip);

    if (outcome.kind === "recorded") {
      added += 1;
    } else {
      known += 1;
    }
  }

  const parts: string[] = [];
  if (added > 0) {
    parts.push(`${added} channel${added === 1 ? "" : "s"} added`);
  }
  if (known > 0) {
    parts.push(`${known} already known`);
  }
  if (unreadable > 0) {
    parts.push(`${unreadable} we couldn't read`);
  }

  if (added === 0 && known === 0) {
    return {
      status: "error",
      message: "None of those looked like YouTube channel links.",
    };
  }

  return {
    status: "success",
    message: `Thank you — ${parts.join(", ")}.`,
  };
}
