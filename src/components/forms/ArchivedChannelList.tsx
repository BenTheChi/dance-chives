"use client";

import { useMemo } from "react";
import type { ArchivedChannel } from "@/db/queries/archived-channels";
import {
  MAX_VISIBLE,
  matchChannels,
} from "@/lib/utils/channel-search";

/**
 * The channels already in the archive, filtered live by the submission input.
 *
 * ## Why it shares the submit box rather than having its own search field
 *
 * The question a visitor is answering at this point in the page is "is my
 * channel already here?" — which is the same keystroke as "let me submit my
 * channel". Two inputs would make them type it twice and would leave the
 * unanswered question sitting next to the form. Filtering as they type answers
 * it before they press submit, and a duplicate is caught by the person rather
 * than by the error message afterwards.
 *
 * ## Bounded
 *
 * At most `MAX_VISIBLE` rows render, inside a fixed-height scroller. There are
 * 16 active channels today so neither limit is reachable yet, but the list is
 * append-only as channels are onboarded and an unbounded one would eventually
 * push the submit form off the screen.
 */


export function ArchivedChannelList({
  channels,
  query,
}: {
  channels: ArchivedChannel[];
  /** The live value of the submission input. */
  query: string;
}) {
  const matches = useMemo(
    () => matchChannels(channels, query),
    [channels, query],
  );

  const visible = matches.slice(0, MAX_VISIBLE);
  const hidden = matches.length - visible.length;

  if (channels.length === 0) return null;

  return (
    <div className="w-full mt-6">
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <h4 className="font-bold">
          Already archiving{" "}
          <span className="tabular-nums">{channels.length}</span>{" "}
          {channels.length === 1 ? "channel" : "channels"}
        </h4>
        {query.trim() ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            {matches.length} {matches.length === 1 ? "match" : "matches"}
          </span>
        ) : null}
      </div>

      {matches.length === 0 ? (
        // Not an error state: a channel that is not in this list is exactly the
        // one worth submitting, so the empty result is turned into the nudge.
        <p className="rounded-sm border-2 border-dashed border-primary-light/60 p-4 text-sm">
          No match — that channel isn&apos;t archived yet. Submit it above.
        </p>
      ) : (
        <>
          <ul
            className="max-h-64 overflow-y-auto rounded-sm border-2 border-primary-light divide-y divide-primary-light/40"
            // The list is the answer to "is it already here?", so screen
            // readers get told when the count changes under them.
            aria-live="polite"
          >
            {visible.map((channel) => (
              <li key={channel.id}>
                {channel.url ? (
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm hover:bg-primary-light/20 transition-colors"
                  >
                    <span className="min-w-0 truncate">{channel.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {channel.videoCount.toLocaleString()}
                    </span>
                  </a>
                ) : (
                  <div className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{channel.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {channel.videoCount.toLocaleString()}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground mt-2">
            {hidden > 0
              ? `Showing the top ${MAX_VISIBLE} of ${matches.length} — keep typing to narrow it down. `
              : ""}
            Counts are videos published to the archive.
          </p>
        </>
      )}
    </div>
  );
}
