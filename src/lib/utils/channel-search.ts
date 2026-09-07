import type { ArchivedChannel } from "@/db/queries/archived-channels";

/**
 * Live filtering for the archived-channel list.
 *
 * Extracted from the component so the matching rules can be tested directly:
 * this is the logic that answers "is my channel already here?", and getting it
 * wrong sends someone to submit a duplicate.
 */

/** Never render more than this many rows at once. */
export const MAX_VISIBLE = 50;

/**
 * Strip everything but letters and digits before comparing.
 *
 * The input doubles as the submission field, so what someone types is often a
 * URL rather than a name — "youtube.com/@bitgoeul" has to find "Bitgoeul
 * Dancers". Folding case and punctuation makes the handle inside a pasted URL
 * match the channel's display name, which a literal substring search would
 * miss entirely.
 */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Channels matching `query`, in the order given. A blank query matches
 * everything, so the caller's default ordering (most videos first) stands.
 */
export function matchChannels(
  channels: ArchivedChannel[],
  query: string,
): ArchivedChannel[] {
  const q = normalize(query);
  if (!q) return channels;

  return channels.filter(
    (channel) =>
      normalize(channel.name).includes(q) ||
      normalize(channel.url ?? "").includes(q),
  );
}
