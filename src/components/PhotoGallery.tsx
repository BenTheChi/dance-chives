"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoLightbox } from "@/components/ui/photo-lightbox";
import { Picture } from "@/types/event";

interface PhotoGalleryProps {
  images: Picture[];
}

export function PhotoGallery({ images }: PhotoGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-row gap-5 flex-wrap justify-center">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
            onClick={() => handleImageSelect(index)}
          >
            <Image
              src={image.url}
              alt={image.title || `Gallery image ${index + 1}`}
              width={200}
              height={200}
              className="object-contain w-full max-w-[200px] h-auto rounded-md"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-md" />
          </div>
        ))}
      </div>

      {selectedImageIndex !== null && (
        <PhotoLightbox
          image={images[selectedImageIndex]}
          isOpen={selectedImageIndex !== null}
          onClose={() => setSelectedImageIndex(null)}
          onNext={() =>
            selectedImageIndex !== null
              ? setSelectedImageIndex((selectedImageIndex + 1) % images.length)
              : null
          }
          onPrev={() =>
            selectedImageIndex !== null
              ? setSelectedImageIndex(
                  (selectedImageIndex - 1 + images.length) % images.length
                )
              : null
          }
          hasNext={images.length > 1}
          hasPrev={images.length > 1}
          currentIndex={selectedImageIndex}
          totalImages={images.length}
        />
      )}
    </>
  );
}

