"use client";

import { useState } from "react";
import NextImage from "next/image";
import { PhotoLightbox } from "@/components/ui/photo-lightbox";
import { Image } from "@/types/image";

interface PosterImageProps {
  poster: Image | null;
  originalPoster?: Image | null;
  className?: string;
  width?: number;
  height?: number;
  eventTitle?: string;
  type?: "event" | "section";
}

export function PosterImage({
  poster,
  originalPoster,
  className = "",
  width = 357,
  height = 357,
  eventTitle,
  type = "event",
}: PosterImageProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
