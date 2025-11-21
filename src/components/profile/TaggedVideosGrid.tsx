"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { VideoCard } from "@/components/videos/VideoCard";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { Video } from "@/types/event";
import { UserSearchItem } from "@/types/user";
import { VIDEO_ROLE_WINNER, VIDEO_ROLE_DANCER } from "@/lib/utils/roles";

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
  taggedUsers?: UserSearchItem[];
}

interface TaggedVideosGridProps {
  videos: TaggedVideo[];
  isWinner?: boolean;
}

export function TaggedVideosGrid({
  videos,
  isWinner = false,
}: TaggedVideosGridProps) {
  const { data: session } = useSession();
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );

  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);
  };

  // Convert TaggedVideo to Video format for VideoLightbox
  const convertToVideo = (taggedVideo: TaggedVideo): Video => {
    // Separate winners and dancers from taggedUsers based on roles
    const winners: typeof taggedVideo.taggedUsers = [];
    const dancers: typeof taggedVideo.taggedUsers = [];

    (taggedVideo.taggedUsers || []).forEach((user) => {
      if (!user || !user.username) return;
      const role = user.role?.toUpperCase();
      if (role === "WINNER" || role === VIDEO_ROLE_WINNER) {
        winners.push(user);
      }
      if (role === "DANCER" || role === VIDEO_ROLE_DANCER || !role) {
        dancers.push(user);
      }
    });

    return {
      id: taggedVideo.videoId,
      title: taggedVideo.videoTitle,
      src: taggedVideo.videoSrc || "",
      styles: taggedVideo.styles || [],
      type: (taggedVideo as any).type || "battle", // Include type if available, default to battle
      taggedWinners: winners,
      taggedDancers: dancers,
    };
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {videos.map((video: TaggedVideo, index: number) => (
          <VideoCard
            key={video.videoId}
            video={{
              id: video.videoId,
              title: video.videoTitle,
              src: video.videoSrc || "",
              styles: video.styles || [],
              type: (video as any).type || "battle", // Include type if available, default to battle
              taggedWinners: (video.taggedUsers || []).filter(
                (user) =>
                  user?.role?.toUpperCase() === "WINNER" ||
                  user?.role?.toUpperCase() === VIDEO_ROLE_WINNER
              ),
              taggedDancers: (video.taggedUsers || []).filter(
                (user) =>
                  !user?.role ||
                  user.role.toUpperCase() === "DANCER" ||
                  user.role.toUpperCase() === VIDEO_ROLE_DANCER
              ),
            }}
            eventLink={`/events/${video.eventId}`}
            eventTitle={video.eventTitle}
            sectionTitle={video.sectionTitle}
            onClick={() => handleVideoSelect(index)}
            currentUserId={session?.user?.id}
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
          eventLink={`/events/${videos[selectedVideoIndex].eventId}`}
          eventTitle={videos[selectedVideoIndex].eventTitle}
          eventId={videos[selectedVideoIndex].eventId}
          sectionTitle={videos[selectedVideoIndex].sectionTitle}
          bracketTitle={undefined}
          sectionStyles={undefined}
          applyStylesToVideos={undefined}
          currentUserId={session?.user?.id}
        />
      )}
    </>
  );
}
