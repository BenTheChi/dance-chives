"use client";

import { useState, useMemo } from "react";
import { EventCard } from "@/components/ui/event-card";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { Video } from "@/types/event";
import { VIDEO_ROLE_WINNER, fromNeo4jRoleFormat } from "@/lib/utils/roles";

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

  // Check if this is a workshop or session (don't show winner badges for these)
  const isWorkshopOrSession =
    eventLink.startsWith("/workshops/") || eventLink.startsWith("/sessions/");

  // Check if current user is a winner for each video
  const videosWithWinnerStatus = useMemo(() => {
    return videos.map((video) => {
      // Don't show winner badges for workshop/session videos
      if (isWorkshopOrSession) {
        return { video, isWinner: false };
      }
      if (!currentUserId || !video.taggedWinners) {
        return { video, isWinner: false };
      }
      const isWinner = video.taggedWinners.some((user) => {
        return user.id === currentUserId || user.username === currentUserId;
      });
      return { video, isWinner };
    });
  }, [videos, currentUserId, isWorkshopOrSession]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {videosWithWinnerStatus.map(({ video, isWinner }, index: number) => (
          <EventCard
            eventLink={eventLink}
            eventTitle={eventTitle}
            key={video.id}
            video={video}
            onClick={() => handleVideoSelect(index)}
            isWinner={isWinner}
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
