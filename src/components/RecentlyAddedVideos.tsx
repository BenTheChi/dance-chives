"use client";

import { VideoCard } from "@/components/videos/VideoCard";
import { Video } from "@/types/video";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleVideoClick = (item: {
    eventId: string;
    sectionId?: string;
    bracketId?: string;
    video: Video;
  }) => {
    if (item.sectionId) {
      const url = item.bracketId
        ? `/events/${item.eventId}/sections/${item.sectionId}?bracket=${item.bracketId}&video=${item.video.id}`
        : `/events/${item.eventId}/sections/${item.sectionId}?video=${item.video.id}`;
      router.push(url);
    } else {
      router.push(`/events/${item.eventId}`);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {videos.map((item) => {
        const eventLink = item.sectionId
          ? `/events/${item.eventId}/sections/${item.sectionId}`
          : `/events/${item.eventId}`;

        return (
          <VideoCard
            key={item.video.id}
            video={item.video}
            eventLink={eventLink}
            eventTitle={item.eventTitle}
            sectionTitle={item.sectionTitle}
            bracketTitle={item.bracketTitle}
            onClick={() => handleVideoClick(item)}
            eventId={item.eventId}
          />
        );
      })}
    </div>
  );
}
