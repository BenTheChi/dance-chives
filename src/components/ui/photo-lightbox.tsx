"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Maximize, Loader2 } from "lucide-react";
import { Image } from "@/types/image";
import NextImage from "next/image";

interface PhotoLightboxProps {
  image: Image;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentIndex: number;
  totalImages: number;
  showCaption?: boolean;
}

export function PhotoLightbox({
  image,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  currentIndex,
  totalImages,
  showCaption = false,
}: PhotoLightboxProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrev) onPrev();
          break;
        case "ArrowRight":
          if (hasNext) onNext();
          break;
        case "f":
        case "F":
          handleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  // Reset loading state when image changes
  useEffect(() => {
    if (isOpen && image) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [image, isOpen]);

  // Focus management: move focus to close button when lightbox opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const displayTitle = image?.title || `Image ${currentIndex + 1}`;
  const displayAlt = image?.caption || displayTitle;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">{displayTitle}</DialogTitle>
      <DialogContent
        closeButton={false}
        className="h-[95vh] sm:h-[90vh] p-0 gap-0 m-2 !max-w-[95vw] !w-[95vw]"
      >
        <div className="flex flex-col h-full w-full bg-black">
          {/* Header */}
          <div className="flex items-center justify-between p-2 sm:p-4 bg-black text-white flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <h2 className="text-sm sm:text-lg font-semibold truncate">
                {displayTitle}
              </h2>
              <span className="text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                {currentIndex + 1} of {totalImages}
              </span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {hasPrev && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrev}
                  className="text-white hover:bg-fog-white/20 h-8 w-8 sm:h-10 sm:w-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}

              {hasNext && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                  className="text-white hover:bg-fog-white/20 h-8 w-8 sm:h-10 sm:w-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="text-white hover:bg-fog-white/20 h-8 w-8 sm:h-10 sm:w-10"
                aria-label="Toggle fullscreen"
              >
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-fog-white/20 h-8 w-8 sm:h-10 sm:w-10"
                aria-label="Close lightbox"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          {/* Image Display Area */}
          <div className="flex-1 relative min-h-0 flex items-center justify-center p-4 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-white animate-spin" />
              </div>
            )}

            {hasError ? (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <p className="text-sm sm:text-base mb-2">
                  Failed to load image
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  {image?.url || "Invalid image URL"}
                </p>
              </div>
            ) : image.url ? (
              <div className="relative w-full h-full">
                <NextImage
                  src={image.url}
                  alt={displayAlt}
                  fill
                  className={`object-contain ${
                    isLoading ? "opacity-0" : "opacity-100"
                  } transition-opacity duration-200`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 95vw"
                  unoptimized={false}
                />
              </div>
            ) : null}

            {/* Navigation areas for clicking on sides of image */}
            {!hasError && image?.url && (
              <>
                {hasPrev && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1/3 cursor-w-resize"
                    onClick={onPrev}
                    aria-label="Previous image"
                  />
                )}
                {hasNext && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/3 cursor-e-resize"
                    onClick={onNext}
                    aria-label="Next image"
                  />
                )}
              </>
            )}
          </div>

          {/* Caption area - only shown when showCaption is true and caption exists */}
          {showCaption && image?.caption && (
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-black border-t border-gray-800">
              <p className="text-sm sm:text-base text-white text-center break-words">
                {image.caption}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
