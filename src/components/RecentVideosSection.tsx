"use client";

import { VideoCard } from "@/components/videos/VideoCard";
import { Video } from "@/types/video";
import { useState } from "react";
import { VideoLightbox } from "@/components/ui/video-lightbox";

interface RecentVideosSectionProps {
  videos: Array<{
    video: Video;
    eventId: string;
    eventTitle: string;
    sectionId?: string;
    sectionTitle?: string;
    bracketId?: string;
    bracketTitle?: string;
  }>;
}

export function RecentVideosSection({ videos }: RecentVideosSectionProps) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );

  const handleNext = () => {
    if (selectedVideoIndex !== null && selectedVideoIndex < videos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedVideoIndex !== null && selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };

  const selectedVideoData =
    selectedVideoIndex !== null ? videos[selectedVideoIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(({ video, eventId, eventTitle }, index) => (
          <VideoCard
            key={video.id}
            video={video}
            eventLink={`/events/${eventId}`}
            eventTitle={eventTitle}
            onClick={() => setSelectedVideoIndex(index)}
            styles={video.styles}
            eventId={eventId}
          />
        ))}
      </div>

      {selectedVideoData && (
        <VideoLightbox
          video={selectedVideoData.video}
          isOpen={selectedVideoIndex !== null}
          onClose={() => setSelectedVideoIndex(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={
            selectedVideoIndex !== null &&
            selectedVideoIndex < videos.length - 1
          }
          hasPrev={selectedVideoIndex !== null && selectedVideoIndex > 0}
          currentIndex={selectedVideoIndex ?? 0}
          totalVideos={videos.length}
          eventLink={`/events/${selectedVideoData.eventId}`}
          eventTitle={selectedVideoData.eventTitle}
          eventId={selectedVideoData.eventId}
          sectionTitle={selectedVideoData.sectionTitle || ""}
          bracketTitle={selectedVideoData.bracketTitle}
        />
      )}
    </>
  );
}

