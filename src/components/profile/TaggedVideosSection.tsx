"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VideoCard } from "@/components/videos/VideoCard";
import { useRouter } from "next/navigation";
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
  type?: "battle" | "freestyle" | "choreography" | "class";
  taggedUsers?: UserSearchItem[];
  eventCreatedAt?: string | Date;
}

interface TaggedVideosSectionProps {
  videos: TaggedVideo[];
}

// Helper function to parse date string (MM/DD/YYYY format)
function parseEventDate(dateStr: string): Date {
  if (dateStr.includes("-")) {
    return new Date(dateStr);
  }
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

// Check if video is in the future (using eventCreatedAt as proxy)
// If eventCreatedAt is not available, default to past
function isVideoInFuture(video: TaggedVideo): boolean {
  if (!video.eventCreatedAt) {
    return false; // Default to past if no date available
  }
  const eventDate = new Date(video.eventCreatedAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate >= today;
}

// Count wins in videos
function countWinsInVideos(videos: TaggedVideo[]): number {
  return videos.filter((video) => {
    return (video.taggedUsers || []).some(
      (user) =>
        user?.role?.toUpperCase() === "WINNER" ||
        user?.role?.toUpperCase() === VIDEO_ROLE_WINNER
    );
  }).length;
}

export function TaggedVideosSection({ videos }: TaggedVideosSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showWinsOnly, setShowWinsOnly] = useState(false);

  // Count total wins
  const winCount = useMemo(() => countWinsInVideos(videos), [videos]);

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videos;

    // Filter by wins if toggle is on
    if (showWinsOnly) {
      filtered = filtered.filter((video) => {
        return (video.taggedUsers || []).some(
          (user) =>
            user?.role?.toUpperCase() === "WINNER" ||
            user?.role?.toUpperCase() === VIDEO_ROLE_WINNER
        );
      });
    }

    // Sort: ascending for future, descending for past
    return filtered.sort((a, b) => {
      const isAFuture = isVideoInFuture(a);
      const isBFuture = isVideoInFuture(b);

      // Future videos first, then past
      if (isAFuture && !isBFuture) return -1;
      if (!isAFuture && isBFuture) return 1;

      // Within same category, sort by date
      const dateA = a.eventCreatedAt ? new Date(a.eventCreatedAt).getTime() : 0;
      const dateB = b.eventCreatedAt ? new Date(b.eventCreatedAt).getTime() : 0;

      if (isAFuture) {
        return dateA - dateB; // Ascending for future
      } else {
        return dateB - dateA; // Descending for past
      }
    });
  }, [videos, showWinsOnly]);

  const handleVideoSelect = (video: TaggedVideo) => {
    router.push(`/watch/${video.eventId}?video=${video.videoId}`);
  };

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <h2 className="text-2xl font-bold mb-4">
        Tagged Videos ({videos.length})
      </h2>
      <div className="bg-primary-dark border-secondary-light border-4 rounded-sm overflow-visible">
        {/* Winner Filter Toggle */}
        <div className="flex items-center justify-center gap-3 p-3 bg-primary rounded-sm border-b-3 border-secondary-light text-center">
          <Switch
            id="wins-only-toggle"
            checked={showWinsOnly}
            onCheckedChange={setShowWinsOnly}
          />
          <Label htmlFor="wins-only-toggle" className="cursor-pointer">
            Show only wins ({winCount})
          </Label>
        </div>

        <div className="max-h-[600px] overflow-y-auto py-3 px-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 overflow-visible">
            {filteredAndSortedVideos.map(
              (video: TaggedVideo, index: number) => (
                <VideoCard
                  video={{
                    id: video.videoId,
                    title: video.videoTitle,
                    src: video.videoSrc || "",
                    styles: video.styles || [],
                    type: video.type || "battle",
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
                  onClick={() => handleVideoSelect(video)}
                  currentUserId={session?.user?.id}
                  eventId={video.eventId}
                  key={video.videoId}
                />
              )
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
