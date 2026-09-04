"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import {
  CHANNEL_URL_ERROR_MESSAGES,
  parseYouTubeChannelUrl,
  type ParsedChannelRef,
} from "@/lib/submissions/youtube-channel-url";
import type { ChannelSubmissionFormState } from "@/lib/submissions/channel-submission-state";

interface YouTubeChannelInfo {
  channelId: string;
  title: string;
  videoCount?: number;
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
 * Accept a member's claim that a channel is worth archiving.
 *
 * Membership is the bar (decision 1): there is no anonymous path. Unlike a
 * correction, this does not write through to anything live — the manager's
 * `channel_discovery_channel` has no proposed state, and `is_active` gates
 * real ingest, so promoting a submission stays a human act.
 */
export async function submitChannel(
  _previous: ChannelSubmissionFormState,
  formData: FormData,
): Promise<ChannelSubmissionFormState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      status: "error",
      message: "Sign in to submit a channel.",
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

  // Re-submitting the same channel is the same claim, not a new one.
  await prisma.channelSubmission.upsert({
    where: { userId_channelUrl: { userId, channelUrl: ref.url } },
    create: {
      userId,
      channelUrl: ref.url,
      rawInput: rawInput.trim(),
      youtubeChannelId: info?.channelId,
      channelName: info?.title,
      videoCount: info?.videoCount,
      alreadyArchived,
      status: alreadyArchived ? "duplicate" : "pending",
    },
    update: {
      rawInput: rawInput.trim(),
      youtubeChannelId: info?.channelId,
      channelName: info?.title,
      videoCount: info?.videoCount,
      alreadyArchived,
    },
  });

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
    message: "Got it. We'll take a look at this channel.",
    resolved: {
      name: displayName,
      videoCount: info?.videoCount,
      alreadyArchived: false,
    },
  };
}
