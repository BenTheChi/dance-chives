"use client";

import { useState } from "react";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { Video } from "@/types/video";
import { useSession } from "next-auth/react";

interface RecentlyAddedVideosProps {
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

export function RecentlyAddedVideos({ videos }: RecentlyAddedVideosProps) {
  const { data: session } = useSession();
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );

  const handleVideoClick = (index: number) => {
    setSelectedVideoIndex(index);
  };

  const handleClose = () => {
    setSelectedVideoIndex(null);
  };

  const handleNext = () => {
    if (selectedVideoIndex !== null) {
      const nextIndex = (selectedVideoIndex + 1) % videos.length;
      setSelectedVideoIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (selectedVideoIndex !== null) {
      const prevIndex =
        (selectedVideoIndex - 1 + videos.length) % videos.length;
      setSelectedVideoIndex(prevIndex);
    }
  };

  const selectedItem =
    selectedVideoIndex !== null ? videos[selectedVideoIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {videos.map((item, index) => {
          return (
            <VideoCard
              key={item.video.id}
              video={item.video}
              eventLink={`/events/${item.eventId}`}
              eventTitle={item.eventTitle}
              sectionTitle={item.sectionTitle}
              bracketTitle={item.bracketTitle}
              onClick={() => handleVideoClick(index)}
              currentUserId={session?.user?.id}
              eventId={item.eventId}
            />
          );
        })}
      </div>

      {selectedItem && selectedVideoIndex !== null && (
        <VideoLightbox
          video={selectedItem.video}
          isOpen={selectedVideoIndex !== null}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={videos.length > 1}
          hasPrev={videos.length > 1}
          currentIndex={selectedVideoIndex}
          totalVideos={videos.length}
          eventLink={`/events/${selectedItem.eventId}`}
          eventTitle={selectedItem.eventTitle}
          eventId={selectedItem.eventId}
          sectionTitle={selectedItem.sectionTitle || ""}
          sectionSlug={selectedItem.sectionId}
          bracketTitle={selectedItem.bracketTitle}
          enableUrlRouting={false}
        />
      )}
    </>
  );
}
