"use client";

import { useState } from "react";
import NextImage from "next/image";
import { PhotoLightbox } from "@/components/ui/photo-lightbox";
import { Image } from "@/types/image";
import { youtubeThumbnailUrl } from "@/lib/utils/event-thumbnail";

interface PosterImageProps {
  poster: Image | null;
  originalPoster?: Image | null;
  className?: string;
  width?: number;
  height?: number;
  eventTitle?: string;
  type?: "event" | "section";
  /**
   * YouTube id to fall back to when there is no poster — the video the
   * publish-time ladder chose to represent this event (a trailer where one
   * exists, otherwise the highest bracket). There are zero posters across the
   * archive, so in practice this is what renders.
   */
  fallbackVideoSrc?: string | null;
}

export function PosterImage({
  poster,
  originalPoster,
  className = "",
  width = 357,
  height = 357,
  eventTitle,
  type = "event",
  fallbackVideoSrc,
}: PosterImageProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  // A YouTube frame can 404 or come back as YouTube's grey placeholder; if it
  // fails, drop to the mascot rather than showing a broken image.
  const [videoFailed, setVideoFailed] = useState(false);

  // No poster, but a video that stands in for one. Deliberately NOT clickable
  // into the lightbox: the lightbox shows a poster at full size, and a video
  // frame blown up is just a blurry still.
  if (!poster && fallbackVideoSrc && !videoFailed) {
    return (
      <div
        className={`card relative w-full h-[300px] md:h-[400px] overflow-hidden bg-neutral-800 ${className}`}
      >
        <NextImage
          src={youtubeThumbnailUrl(fallbackVideoSrc)}
          alt={eventTitle ?? ""}
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          onError={() => setVideoFailed(true)}
          className="object-cover"
        />
      </div>
    );
  }

  if (!poster) {
    const placeholderImage =
      type === "section"
        ? "/mascot/Mascot3_Mono_onLight.svg"
        : "/mascot/Dancechives_Mascot1_Mono_onLight_slim.png";
    
    return (
      <div
        className={`card w-full h-[300px] md:h-[400px] bg-neutral-400 flex items-center justify-center ${className}`}
      >
        <div className="relative w-full h-full">
          <NextImage
            src={placeholderImage}
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>
    );
  }

  // Use originalPoster for lightbox if available, otherwise fall back to poster
  const lightboxImage = originalPoster || poster;

  return (
    <>
      <div
        className={`card aspect-square cursor-pointer transition-all duration-200 ${className}`}
        onClick={() => setIsLightboxOpen(true)}
      >
        {poster.url ? (
          <NextImage
            src={poster.url}
            alt={poster.title}
            width={width}
            height={height}
            className="object-contain w-full"
          />
        ) : null}
      </div>

      {isLightboxOpen && (
        <PhotoLightbox
          image={lightboxImage}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          onNext={() => {}}
          onPrev={() => {}}
          hasNext={false}
          hasPrev={false}
          currentIndex={0}
          totalImages={1}
        />
      )}
    </>
  );
}
