"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { Video } from "@/types/video";

interface VideoGalleryProps {
  videos: Video[];
  eventLink: string;
  eventTitle: string;
  eventId: string;
  sectionTitle: string;
  sectionSlug?: string;
  bracketTitle?: string;
  sectionStyles?: string[];
  applyStylesToVideos?: boolean;
  currentUserId?: string;
  enableUrlRouting?: boolean;
}

export default function VideoGallery({
  videos,
  eventLink,
  eventTitle,
  eventId,
  sectionTitle,
  sectionSlug,
  bracketTitle,
  sectionStyles,
  applyStylesToVideos,
  currentUserId,
  enableUrlRouting = false,
}: VideoGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastScrolledVideoId = useRef<string | null>(null);

  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );

  // Get video ID from URL query param
  const videoIdFromUrl = enableUrlRouting ? searchParams.get("video") : null;

  // Sync state with URL query param
  useEffect(() => {
    if (!enableUrlRouting) {
      return;
    }

    if (!videoIdFromUrl) {
      if (selectedVideoIndex !== null) {
        // URL param removed, close lightbox
        setSelectedVideoIndex(null);
      }
      lastScrolledVideoId.current = null;
      return;
    }

    const index = videos.findIndex((v) => v.id === videoIdFromUrl);
    if (index !== -1) {
      setSelectedVideoIndex(index);
      // Reset scroll flag if video ID changed
      if (lastScrolledVideoId.current !== videoIdFromUrl) {
        lastScrolledVideoId.current = null;
      }
    } else if (selectedVideoIndex !== null) {
      // Video not found in current videos, close lightbox
      setSelectedVideoIndex(null);
    }
  }, [videoIdFromUrl, videos, enableUrlRouting]);

  // Auto-scroll to video when URL param changes
  useEffect(() => {
    if (!enableUrlRouting || !videoIdFromUrl) {
      return;
    }

    // Only scroll if we haven't scrolled to this video yet
    if (lastScrolledVideoId.current === videoIdFromUrl) {
      return;
    }

    // Wait a bit for DOM to update, then scroll
    const timeoutId = setTimeout(() => {
      const videoElement = videoRefs.current.get(videoIdFromUrl);
      if (videoElement) {
        const navbarHeight = 56; // h-14 = 56px
        const padding = 16;
        const scrollOffset = navbarHeight + padding;

        const elementTop =
          videoElement.getBoundingClientRect().top + window.scrollY;
        const scrollTo = elementTop - scrollOffset;

        window.scrollTo({
          top: scrollTo,
          behavior: "smooth",
        });

        lastScrolledVideoId.current = videoIdFromUrl;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [videoIdFromUrl, enableUrlRouting]);

  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);

    if (enableUrlRouting && sectionSlug) {
      const videoId = videos[index].id;
      router.push(
        `/events/${eventId}/sections/${sectionSlug}?video=${videoId}`,
        { scroll: false }
      );
    }
  };

  const handleClose = () => {
    setSelectedVideoIndex(null);

    if (enableUrlRouting && sectionSlug) {
      router.push(`/events/${eventId}/sections/${sectionSlug}`, {
        scroll: false,
      });
    }
  };

  const handleNext = () => {
    if (selectedVideoIndex !== null) {
      const nextIndex = (selectedVideoIndex + 1) % videos.length;
      setSelectedVideoIndex(nextIndex);

      if (enableUrlRouting && sectionSlug) {
        const nextVideoId = videos[nextIndex].id;
        router.push(
          `/events/${eventId}/sections/${sectionSlug}?video=${nextVideoId}`,
          { scroll: false }
        );
      }
    }
  };

  const handlePrev = () => {
    if (selectedVideoIndex !== null) {
      const prevIndex =
        (selectedVideoIndex - 1 + videos.length) % videos.length;
      setSelectedVideoIndex(prevIndex);

      if (enableUrlRouting && sectionSlug) {
        const prevVideoId = videos[prevIndex].id;
        router.push(
          `/events/${eventId}/sections/${sectionSlug}?video=${prevVideoId}`,
          { scroll: false }
        );
      }
    }
  };

  // Set ref for video card
  const setVideoRef = (videoId: string, element: HTMLDivElement | null) => {
    if (element) {
      videoRefs.current.set(videoId, element);
    } else {
      videoRefs.current.delete(videoId);
    }
  };

  // Determine styles to display
  const displayStyles =
    applyStylesToVideos && sectionStyles ? sectionStyles : undefined;

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {videos.map((video: Video, index: number) => (
          <div
            key={video.id}
            ref={(el) => setVideoRef(video.id, el)}
            data-video-id={video.id}
          >
            <VideoCard
              video={video}
              eventLink={eventLink}
              eventTitle={eventTitle}
              sectionTitle={sectionTitle}
              bracketTitle={bracketTitle}
              onClick={() => handleVideoSelect(index)}
              styles={displayStyles}
              currentUserId={currentUserId}
              eventId={eventId}
            />
          </div>
        ))}
      </div>

      {selectedVideoIndex !== null && (
        <VideoLightbox
          video={videos[selectedVideoIndex]}
          isOpen={selectedVideoIndex !== null}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={videos.length > 1}
          hasPrev={videos.length > 1}
          currentIndex={selectedVideoIndex}
          totalVideos={videos.length}
          eventLink={eventLink}
          eventTitle={eventTitle}
          eventId={eventId}
          sectionTitle={sectionTitle}
          sectionSlug={sectionSlug}
          bracketTitle={bracketTitle}
          sectionStyles={sectionStyles}
          applyStylesToVideos={applyStylesToVideos}
          currentUserId={currentUserId}
          enableUrlRouting={enableUrlRouting}
        />
      )}
    </div>
  );
}
