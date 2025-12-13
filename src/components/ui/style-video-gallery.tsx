"use client";

import { useState } from "react";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { Video } from "@/types/event";

interface StyleVideoItem {
  video: Video;
  eventId: string;
  eventTitle: string;
  sectionId: string;
  sectionTitle: string;
}

interface StyleVideoGalleryProps {
  videos: StyleVideoItem[];
}

export function StyleVideoGallery({ videos }: StyleVideoGalleryProps) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );

  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {videos.map((item, index) => (
          <VideoCard
            key={item.video.id}
            video={item.video}
            eventLink={`/events/${item.eventId}`}
            eventTitle={item.eventTitle}
            sectionTitle={item.sectionTitle}
            onClick={() => handleVideoSelect(index)}
          />
        ))}
      </div>

      {selectedVideoIndex !== null && (
        <VideoLightbox
          video={videos[selectedVideoIndex].video}
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
          eventLink={`/events/${videos[selectedVideoIndex].eventId}`}
          eventTitle={videos[selectedVideoIndex].eventTitle}
          eventId={videos[selectedVideoIndex].eventId}
          sectionTitle={videos[selectedVideoIndex].sectionTitle}
          sectionSlug={videos[selectedVideoIndex].sectionId}
          bracketTitle={undefined}
          sectionStyles={undefined}
          applyStylesToVideos={undefined}
          currentUserId={undefined}
        />
      )}
    </>
  );
}
