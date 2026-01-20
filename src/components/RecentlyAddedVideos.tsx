"use client";

import { VideoCard } from "@/components/videos/VideoCard";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Video } from "@/types/video";

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
  const router = useRouter();

  const handleVideoClick = (item: (typeof videos)[0]) => {
    router.push(`/watch/${item.eventId}?video=${item.video.id}`);
  };

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
              onClick={() => handleVideoClick(item)}
              currentUserId={session?.user?.id}
              eventId={item.eventId}
            />
          );
        })}
      </div>
    </>
  );
}
