"use client";

import { useState } from "react";
import { EventCard as VideoCard } from "@/components/ui/event-card";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { Video } from "@/types/event";

interface TaggedVideo {
  videoId: string;
  videoTitle: string;
  videoSrc: string;
  eventId: string;
  eventTitle: string;
  sectionId: string;
  sectionTitle: string;
  roles?: string[];
  styles: string[];
}

interface TaggedVideosGridProps {
  videos: TaggedVideo[];
}

export function TaggedVideosGrid({ videos }: TaggedVideosGridProps) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );

  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);
  };

  // Convert TaggedVideo to Video format for VideoLightbox
  const convertToVideo = (taggedVideo: TaggedVideo): Video => ({
    id: taggedVideo.videoId,
    title: taggedVideo.videoTitle,
    src: taggedVideo.videoSrc || "",
    styles: taggedVideo.styles || [],
    taggedUsers: [], // VideoLightbox will handle this if needed
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {videos.map((video: TaggedVideo, index: number) => (
          <VideoCard
            key={`${video.videoId}-${index}`}
            video={{
              id: video.videoId,
              title: video.videoTitle,
              src: video.videoSrc || "",
              styles: video.styles || [],
            }}
            eventLink={`/event/${video.eventId}`}
            eventTitle={video.eventTitle}
            onClick={() => handleVideoSelect(index)}
          />
        ))}
      </div>

      {selectedVideoIndex !== null && (
        <VideoLightbox
          video={convertToVideo(videos[selectedVideoIndex])}
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
          eventLink={`/event/${videos[selectedVideoIndex].eventId}`}
          eventTitle={videos[selectedVideoIndex].eventTitle}
          eventId={videos[selectedVideoIndex].eventId}
          sectionTitle={videos[selectedVideoIndex].sectionTitle}
          bracketTitle={undefined}
          sectionStyles={undefined}
          applyStylesToVideos={undefined}
          currentUserId={undefined}
        />
      )}
    </>
  );
}
