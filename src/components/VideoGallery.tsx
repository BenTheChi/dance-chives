"use client";

import { useState } from "react";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { Video } from "@/types/video";

interface VideoGalleryProps {
  videos: Video[];
  eventLink: string;
  eventTitle: string;
  eventId: string;
  sectionTitle: string;
  bracketTitle?: string;
  sectionStyles?: string[];
  applyStylesToVideos?: boolean;
  currentUserId?: string;
}

export default function VideoGallery({
  videos,
  eventLink,
  eventTitle,
  eventId,
  sectionTitle,
  bracketTitle,
  sectionStyles,
  applyStylesToVideos,
  currentUserId,
}: VideoGalleryProps) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );

  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);
  };

  // Determine styles to display
  const displayStyles =
    applyStylesToVideos && sectionStyles ? sectionStyles : undefined;

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {videos.map((video: Video, index: number) => (
          <VideoCard
            key={video.id}
            video={video}
            eventLink={eventLink}
            eventTitle={eventTitle}
            sectionTitle={sectionTitle}
            bracketTitle={bracketTitle}
            onClick={() => handleVideoSelect(index)}
            styles={displayStyles}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {selectedVideoIndex !== null && (
        <VideoLightbox
          video={videos[selectedVideoIndex]}
          isOpen={selectedVideoIndex !== null}
          onClose={() => setSelectedVideoIndex(null)}
          onNext={() =>
            selectedVideoIndex !== null
              ? setSelectedVideoIndex((selectedVideoIndex + 1) % videos.length)
              : null
          }
          onPrev={() =>
            selectedVideoIndex !== null
              ? setSelectedVideoIndex(
                  (selectedVideoIndex - 1 + videos.length) % videos.length
                )
              : null
          }
          hasNext={videos.length > 1}
          hasPrev={videos.length > 1}
          currentIndex={selectedVideoIndex}
          totalVideos={videos.length}
          eventLink={eventLink}
          eventTitle={eventTitle}
          eventId={eventId}
          sectionTitle={sectionTitle}
          bracketTitle={bracketTitle}
          sectionStyles={sectionStyles}
          applyStylesToVideos={applyStylesToVideos}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
