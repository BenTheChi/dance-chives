"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { youtubeThumbnailUrl } from "@/lib/utils/event-thumbnail";

interface EventThumbnailProps {
  /** Bare YouTube id from `EventCard.thumbnailVideoSrc`. */
  videoSrc?: string | null;
  /** Poster, if one ever exists. Preferred over the video frame when present. */
  posterUrl?: string | null;
  title: string;
  className?: string;
  /** Next/Image sizes hint — a 48px table cell should not fetch a 400px image. */
  sizes?: string;
  priority?: boolean;
}

/**
 * An event's image, in one place.
 *
 * There are zero posters across the archive, so in practice this renders a
 * YouTube frame chosen by the publish-time ladder. The mascot below is the
 * final fallback and should now be unreachable — every published event
 * resolves to a real video. That unreachability is the acceptance test, not a
 * hope: if a mascot appears in the list, the backfill has not run for that row.
 */
export function EventThumbnail({
  videoSrc,
  posterUrl,
  title,
  className,
  sizes,
  priority,
}: EventThumbnailProps) {
  // YouTube serves a 120x90 grey "no thumbnail" placeholder rather than a 404
  // for an unknown id, so a broken image cannot be caught by onError alone.
  // hqdefault is used throughout precisely because it always exists; maxres
  // does not, and 404s silently for a large share of older uploads.
  const [failed, setFailed] = useState(false);

  const src = posterUrl || (videoSrc ? youtubeThumbnailUrl(videoSrc) : null);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "relative w-full h-full bg-neutral-400 flex items-center justify-center",
          className,
        )}
      >
        <Image
          src="/mascot/Dancechives_Mascot1_Mono_onLight_slim.png"
          alt=""
          fill
          className="object-contain p-1"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full bg-neutral-800", className)}>
      <Image
        src={src}
        alt={title}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
        // hqdefault is 480x360 (4:3) with letterboxing on 16:9 uploads.
        // Cropping to fill is deliberate: a consistent frame across a dense
        // list matters more than showing the black bars.
        className="object-cover"
      />
    </div>
  );
}
