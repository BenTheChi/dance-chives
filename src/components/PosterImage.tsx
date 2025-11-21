"use client";

import { useState } from "react";
import NextImage from "next/image";
import { PhotoLightbox } from "@/components/ui/photo-lightbox";
import { Image } from "@/types/image";

interface PosterImageProps {
  poster: Image | null;
  className?: string;
  width?: number;
  height?: number;
}

export function PosterImage({
  poster,
  className = "",
  width = 500,
  height = 500,
}: PosterImageProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!poster) {
    return (
      <div
        className={`w-full h-[300px] md:h-[400px] bg-gray-300 text-center m-auto flex items-center justify-center ${className}`}
      >
        No poster
      </div>
    );
  }

  return (
    <>
      <div
        className={`cursor-pointer transition-all duration-200 hover:opacity-90 ${className}`}
        onClick={() => setIsLightboxOpen(true)}
      >
        {poster.url ? (
          <NextImage
            src={poster.url}
            alt={poster.title}
            width={width}
            height={height}
            className="object-contain rounded-md w-full"
          />
        ) : null}
      </div>

      {isLightboxOpen && (
        <PhotoLightbox
          image={poster}
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
