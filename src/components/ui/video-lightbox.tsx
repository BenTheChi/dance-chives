"use client";

import { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StyleBadge } from "@/components/ui/style-badge";
import { X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Video } from "@/types/video";
import { UserSearchItem } from "@/types/user";
import Link from "next/link";
import { TagSelfButton } from "@/components/events/TagSelfButton";
import { VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER } from "@/lib/utils/roles";
import { Trophy } from "lucide-react";
import { extractYouTubeVideoId } from "@/lib/utils";
import { removeTagFromVideo } from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTransition } from "react";

// Helper component for user badge with remove button
function UserBadgeWithRemove({
  user,
  eventId,
  videoId,
  currentUserId,
  badgeClassName,
  icon: Icon,
}: {
  user: UserSearchItem;
  eventId: string;
  videoId: string;
  currentUserId?: string;
  badgeClassName?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canRemove =
    currentUserId &&
    (currentUserId === user.id || currentUserId === user.username);

  const handleRemove = () => {
    if (!currentUserId || !canRemove) return;

    startTransition(async () => {
      try {
        await removeTagFromVideo(eventId, videoId, user.id || user.username);
        toast.success("Successfully removed tag");
        router.refresh();
      } catch (error) {
        console.error("Error removing tag:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove tag. Please try again."
        );
      }
    });
  };

  return (
    <div className="relative inline-block group">
      {canRemove && (
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <Link
        href={`/profiles/${user.username}`}
        className="hover:opacity-80 transition-opacity"
      >
        <Badge
          variant={badgeClassName ? "default" : "secondary"}
          className={
            badgeClassName || "text-xs cursor-pointer hover:bg-secondary/80"
          }
        >
          {Icon && badgeClassName && (
            <Icon className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
          )}
          {user.displayName}
        </Badge>
      </Link>
    </div>
  );
}

// Helper component for displaying user tags
function UserTagList({
  users,
  title,
  icon: Icon,
  iconClassName,
  badgeClassName,
  eventId,
  videoId,
  currentUserId,
}: {
  users: UserSearchItem[];
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  badgeClassName?: string;
  eventId: string;
  videoId: string;
  currentUserId?: string;
}) {
  if (users.length === 0) return null;

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center">
        {Icon && (
          <Icon
            className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${iconClassName || ""}`}
          />
        )}
        <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {users.map((user: UserSearchItem, index: number) => (
          <UserBadgeWithRemove
            key={user.username || index}
            user={user}
            eventId={eventId}
            videoId={videoId}
            currentUserId={currentUserId}
            badgeClassName={badgeClassName}
            icon={Icon}
          />
        ))}
      </div>
    </div>
  );
}

interface VideoLightboxProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentIndex: number;
  totalVideos: number;
  eventLink: string;
  eventTitle: string;
  eventId: string;
  sectionTitle: string;
  bracketTitle?: string;
  sectionStyles?: string[];
  applyStylesToVideos?: boolean;
  currentUserId?: string;
}

export function VideoLightbox({
  video,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  currentIndex,
  totalVideos,
  eventLink,
  eventTitle,
  eventId,
  sectionTitle,
  bracketTitle,
  sectionStyles,
  applyStylesToVideos,
  currentUserId,
}: VideoLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrev) onPrev();
          break;
        case "ArrowRight":
          if (hasNext) onNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  // Check if this is a workshop or session video (legacy check, all events now use /events/)
  const isWorkshopOrSession =
    eventLink.startsWith("/workshops/") ||
    eventLink.startsWith("/sessions/") ||
    eventLink.startsWith("/events/");

  // Get video type, defaulting to "battle" for backwards compatibility
  const videoType = video?.type || "battle";

  // Get tagged users based on video type
  const winners =
    (videoType === "battle" && (video as any)?.taggedWinners) || [];
  const dancers = (video as any)?.taggedDancers || [];
  const choreographers =
    (videoType === "choreography" && (video as any)?.taggedChoreographers) ||
    [];
  const teachers =
    (videoType === "class" && (video as any)?.taggedTeachers) || [];

  // Combine all participants (winners are also dancers, so we deduplicate)
  const allParticipantsSet = new Map<string, UserSearchItem>();
  dancers.forEach((user: UserSearchItem) => {
    if (user && user.username) {
      allParticipantsSet.set(user.username, user);
    }
  });
  winners.forEach((user: UserSearchItem) => {
    if (user && user.username) {
      allParticipantsSet.set(user.username, user);
    }
  });
  const allParticipants = Array.from(allParticipantsSet.values());

  // For user comparisons, we need to check by username if currentUserId is a username
  // or by id if currentUserId is an id. Since currentUserId comes from session, it's likely an id.
  // But we'll check both username and id for compatibility
  const isUserTagged = currentUserId
    ? allParticipants.some(
        (user: UserSearchItem) =>
          user.id === currentUserId || user.username === currentUserId
      )
    : false;
  const isUserWinner =
    currentUserId && videoType === "battle"
      ? winners.some(
          (user: UserSearchItem) =>
            user.id === currentUserId || user.username === currentUserId
        )
      : false;
  const isUserDancer = currentUserId
    ? dancers.some(
        (user: UserSearchItem) =>
          user.id === currentUserId || user.username === currentUserId
      )
    : false;
  const isUserChoreographer =
    currentUserId && videoType === "choreography"
      ? choreographers.some(
          (user: UserSearchItem) =>
            user.id === currentUserId || user.username === currentUserId
        )
      : false;
  const isUserTeacher =
    currentUserId && videoType === "class"
      ? teachers.some(
          (user: UserSearchItem) =>
            user.id === currentUserId || user.username === currentUserId
        )
      : false;

  // Determine if winner self-tagging should be shown (only for battle videos)
  const showWinnerSelfTagging = videoType === "battle";

  // Determine which styles to display: section styles if applyStylesToVideos is true, otherwise video styles
  const displayStyles = useMemo(() => {
    if (applyStylesToVideos && sectionStyles && sectionStyles.length > 0) {
      return sectionStyles;
    }
    return video.styles || [];
  }, [applyStylesToVideos, sectionStyles, video.styles]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">{video.title}</DialogTitle>
      <DialogContent
        closeButton={false}
        className="h-[95vh] sm:h-[90vh] p-0 gap-0 m-2 !max-w-[95vw] !w-[95vw]"
      >
        <div className="flex flex-col h-full w-full bg-black">
          {/* Video Header */}
          <div className="p-2 sm:p-4 bg-black text-white border-b border-white/10">
            {/* First line: Title, metadata, and controls */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
              <div className="flex items-center flex-wrap gap-2 sm:gap-4 min-w-0 flex-1">
                <h2 className="text-sm sm:text-lg font-semibold truncate">
                  {video.title}
                </h2>
                <span className="text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                  {currentIndex + 1} of {totalVideos}
                </span>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300">
                  <Link
                    href={eventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 whitespace-nowrap"
                  >
                    {eventTitle}
                  </Link>
                  {!isWorkshopOrSession && (
                    <>
                      <span>•</span>
                      <span className="whitespace-nowrap">{sectionTitle}</span>
                      {bracketTitle && (
                        <>
                          <span>•</span>
                          <span className="whitespace-nowrap">
                            {bracketTitle}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {hasPrev && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrev}
                    className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}

                {hasNext && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNext}
                    className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            {/* Second line: Style tags */}
            {displayStyles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {displayStyles.map((style) => (
                  <StyleBadge key={style} style={style} />
                ))}
              </div>
            )}
          </div>

          {/* Video Player */}
          <div className="flex-1 relative min-h-[200px] sm:min-h-[300px]">
            {(() => {
              const youtubeId = extractYouTubeVideoId(video.src);
              if (!youtubeId) {
                return (
                  <div className="flex items-center justify-center h-full bg-black text-white">
                    <p className="text-sm">Invalid YouTube URL</p>
                  </div>
                );
              }
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              );
            })()}
          </div>

          {/* Tagged Users Below Video */}
          <div className="bg-black/90 text-white p-3 sm:p-4 border-t border-white/10">
            <div className="flex flex-wrap items-start justify-center gap-10">
              {/* Tag Self Button */}
              {currentUserId && (
                <div className="flex-shrink-0">
                  <TagSelfButton
                    eventId={eventId}
                    target="video"
                    targetId={video.id}
                    currentUserId={currentUserId}
                    videoType={videoType as "battle" | "choreography" | "class"}
                    currentVideoRoles={[
                      ...(isUserDancer ? [VIDEO_ROLE_DANCER] : []),
                      ...(isUserWinner ? [VIDEO_ROLE_WINNER] : []),
                      ...(isUserChoreographer ? ["Choreographer"] : []),
                      ...(isUserTeacher ? ["Teacher"] : []),
                    ]}
                    buttonLabel="Tag Self"
                  />
                </div>
              )}

              {/* Winners - Only show for battle videos */}
              {videoType === "battle" && winners.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <h3 className="font-semibold text-sm sm:text-base">
                        Winners
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {winners.map((winner: UserSearchItem) => (
                        <UserBadgeWithRemove
                          key={winner.username}
                          user={winner}
                          eventId={eventId}
                          videoId={video.id}
                          currentUserId={currentUserId}
                          badgeClassName="bg-yellow-500 hover:bg-yellow-600 text-xs cursor-pointer"
                          icon={Trophy}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Choreographers - Only show for choreography videos */}
              {videoType === "choreography" && choreographers.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <h3 className="font-semibold text-sm sm:text-base">
                        Choreographers
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {choreographers.map(
                        (choreographer: UserSearchItem, index: number) => (
                          <UserBadgeWithRemove
                            key={choreographer.username || index}
                            user={choreographer}
                            eventId={eventId}
                            videoId={video.id}
                            currentUserId={currentUserId}
                            badgeClassName="bg-white/10 text-white border-white/20 text-xs cursor-pointer hover:bg-white/20"
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Teachers - Only show for class videos */}
              {videoType === "class" && teachers.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <h3 className="font-semibold text-sm sm:text-base">
                        Teachers
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {teachers.map(
                        (teacher: UserSearchItem, index: number) => (
                          <UserBadgeWithRemove
                            key={teacher.username || index}
                            user={teacher}
                            eventId={eventId}
                            videoId={video.id}
                            currentUserId={currentUserId}
                            badgeClassName="bg-white/10 text-white border-white/20 text-xs cursor-pointer hover:bg-white/20"
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dancers - Show for all video types */}
              {dancers.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <h3 className="font-semibold text-sm sm:text-base">
                        Dancers
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dancers.map((dancer: UserSearchItem, index: number) => (
                        <UserBadgeWithRemove
                          key={dancer.username || index}
                          user={dancer}
                          eventId={eventId}
                          videoId={video.id}
                          currentUserId={currentUserId}
                          badgeClassName="bg-white/10 text-white border-white/20 text-xs cursor-pointer hover:bg-white/20"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
