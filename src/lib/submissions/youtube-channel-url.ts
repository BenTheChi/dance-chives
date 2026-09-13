/**
 * Parsing and validating a submitted YouTube CHANNEL url.
 *
 * The ask is deliberately narrow — "a channel that posts battle footage" — so
 * the parser's main job is rejecting the things people will paste instead: a
 * video, a playlist, a Short, someone's watch-later link. Those are all
 * plausible mistakes rather than abuse, so each is rejected with a message
 * that says what was pasted and what is wanted.
 */

/** The four shapes a channel url comes in. */
export type ChannelRefKind = "id" | "handle" | "user" | "custom";

export interface ParsedChannelRef {
  kind: ChannelRefKind;
  /** The identifying part: `UC...` for `id`, the name for the others. */
  value: string;
  /** Canonical url for display and storage. */
  url: string;
}

export type ChannelUrlError =
  | "empty"
  | "not_youtube"
  | "is_video"
  | "is_playlist"
  | "unrecognized";

export interface ChannelUrlResult {
  ok: boolean;
  ref?: ParsedChannelRef;
  error?: ChannelUrlError;
}

/** Channel ids are always `UC` + 22 url-safe base64 characters. */
const CHANNEL_ID_PATTERN = /^UC[\w-]{22}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

export const CHANNEL_URL_ERROR_MESSAGES: Record<ChannelUrlError, string> = {
  empty: "Paste a YouTube channel URL.",
  not_youtube: "That is not a YouTube link.",
  is_video:
    "That is a video, not a channel. Open the channel and copy the URL from there.",
  is_playlist:
    "That is a playlist, not a channel. Open the channel and copy the URL from there.",
  unrecognized:
    "We could not read a channel from that URL. It should look like youtube.com/@name.",
};

/**
 * Case folding, and the line it must not cross.
 *
 * Handles and legacy vanity names are case-INSENSITIVE: YouTube resolves
 * `@BoogStudio_TW` and itself reports the channel's handle as
 * `@boogstudio_tw`. Folding them is therefore not merely safe, it produces the
 * spelling YouTube considers canonical — and it is load-bearing for dedupe,
 * because whenever the API lookup fails (no key, API down) `youtubeChannelId`
 * is null and the canonical url is the ONLY thing two submissions can be
 * matched on. Without this, `@Name` and `@name` are two rows for one channel.
 *
 * Channel ids (`UC` + 22 chars) and the `UU…` uploads playlist ids derived
 * from them are case-SENSITIVE base64: `UCr0T5S5UhRZ9RESlMckKKmg` resolves and
 * `ucr0t5s5uhrz9reslmckkmg` returns nothing at all. They are never folded.
 * That asymmetry is the whole reason this is a helper rather than a
 * `.toLowerCase()` on the way out.
 */
function foldName(name: string): string {
  return name.toLowerCase();
}

/**
 * Accepts a full url or a bare handle (`@bitgoeuldancers`), since a handle is
 * what people actually copy off a channel page.
 */
export function parseYouTubeChannelUrl(input: string): ChannelUrlResult {
  const trimmed = input.trim();
  if (trimmed === "") return { ok: false, error: "empty" };

  // A bare handle, with no url around it.
  if (/^@[\w.-]+$/.test(trimmed)) {
    const handle = foldName(trimmed);
    return {
      ok: true,
      ref: {
        kind: "handle",
        value: handle,
        url: `https://www.youtube.com/${handle}`,
      },
    };
  }

  // A bare channel id.
  if (CHANNEL_ID_PATTERN.test(trimmed)) {
    return {
      ok: true,
      ref: {
        kind: "id",
        value: trimmed,
        url: `https://www.youtube.com/channel/${trimmed}`,
      },
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, error: "unrecognized" };
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    return { ok: false, error: "not_youtube" };
  }

  // youtu.be/<id> is always a video share link.
  if (host === "youtu.be") {
    return { ok: false, error: "is_video" };
  }

  // A playlist url still carries a `list`; check it before the path so that
  // /watch?v=..&list=.. reports the more specific problem.
  if (url.pathname === "/playlist" || url.searchParams.has("list")) {
    return {
      ok: false,
      error: url.pathname === "/watch" ? "is_video" : "is_playlist",
    };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return { ok: false, error: "unrecognized" };

  const [first, second] = segments;

  if (first === "watch" || first === "shorts" || first === "live") {
    return { ok: false, error: "is_video" };
  }

  if (first.startsWith("@")) {
    const handle = foldName(first);
    return {
      ok: true,
      ref: {
        kind: "handle",
        value: handle,
        url: `https://www.youtube.com/${handle}`,
      },
    };
  }

  if (first === "channel" && second) {
    if (!CHANNEL_ID_PATTERN.test(second)) {
      return { ok: false, error: "unrecognized" };
    }
    return {
      ok: true,
      ref: {
        kind: "id",
        value: second,
        url: `https://www.youtube.com/channel/${second}`,
      },
    };
  }

  if (first === "user" && second) {
    const user = foldName(second);
    return {
      ok: true,
      ref: {
        kind: "user",
        value: user,
        url: `https://www.youtube.com/user/${user}`,
      },
    };
  }

  // Legacy vanity urls (`/c/Name`, and the bare `/Name` that predates handles).
  if (first === "c" && second) {
    const custom = foldName(second);
    return {
      ok: true,
      ref: {
        kind: "custom",
        value: custom,
        url: `https://www.youtube.com/c/${custom}`,
      },
    };
  }

  if (segments.length === 1 && /^[\w.-]+$/.test(first)) {
    const custom = foldName(first);
    return {
      ok: true,
      ref: {
        kind: "custom",
        value: custom,
        url: `https://www.youtube.com/c/${custom}`,
      },
    };
  }

  return { ok: false, error: "unrecognized" };
}
