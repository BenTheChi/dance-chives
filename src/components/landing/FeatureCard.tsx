"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoLightbox } from "@/components/ui/photo-lightbox";
import { Image as ImageType } from "@/types/image";

interface FeatureCardProps {
  title: string;
  description: string;
  cardBgColor?: string;
  cardBorderColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  previewPlaceholder?: string;
  image?: string;
}

export function FeatureCard({
  title,
  description,
  cardBgColor = "bg-[#f5f5f5]",
  cardBorderColor = "border-black",
  headerBgColor = "bg-[#3a3a3a]",
  headerTextColor = "text-[#c4ffd9]",
  previewPlaceholder = "Feature preview coming soon!",
  image,
}: FeatureCardProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Convert image path to Image type for lightbox
  const lightboxImage: ImageType | null = image
    ? {
        id: image,
        title: title,
        url: image,
        type: "gallery",
        file: null,
      }
    : null;

  return (
    <>
      <div
        className={`${cardBgColor} border-8 ${cardBorderColor} overflow-hidden`}
      >
        <div
          className={`p-8 h-32 flex items-center justify-center ${headerBgColor}`}
        >
          <h3
            className={`text-xl font-black ${headerTextColor} text-center uppercase`}
          >
            {title}
          </h3>
        </div>
        <div
          className={`relative h-72 ${cardBgColor} border-t-4 ${cardBorderColor}`}
        >
          {image ? (
            <div
              className="absolute inset-0 border-4 border-black m-4 overflow-hidden cursor-pointer transition-all duration-200 hover:opacity-90"
              onClick={() => setIsLightboxOpen(true)}
            >
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className={`absolute inset-0 flex items-center justify-center bg-[#3a3a3a] text-[#f5f5f5] border-4 border-black m-4`}
            >
              <p className="text-md md:text-lg text-center font-bold uppercase">
                {previewPlaceholder}
              </p>
            </div>
          )}
        </div>
        <div className={`p-8 ${cardBgColor}`}>
          <p className="text-lg text-[#2a2a2a] leading-relaxed font-bold">
            {description}
          </p>
        </div>
      </div>

      {isLightboxOpen && lightboxImage && (
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
