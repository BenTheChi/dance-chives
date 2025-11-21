"use client";

import { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StyleBadge } from "@/components/ui/style-badge";
import { Separator } from "@/components/ui/separator";
import { X, ChevronLeft, ChevronRight, Maximize, Users } from "lucide-react";
import { Video } from "@/types/video";
import { UserSearchItem } from "@/types/user";
import Link from "next/link";
import { TagSelfButton } from "@/components/events/TagSelfButton";
import {
  fromNeo4jRoleFormat,
  VIDEO_ROLE_DANCER,
  VIDEO_ROLE_WINNER,
} from "@/lib/utils/roles";
import { Trophy } from "lucide-react";
import { extractYouTubeVideoId } from "@/lib/utils";

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
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

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
        case "f":
        case "F":
          handleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  // Check if this is a workshop or session video (workshop/session videos don't have dancer/winner tags)
  const isWorkshopOrSession =
    eventLink.startsWith("/workshops/") || eventLink.startsWith("/sessions/");

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

  // Determine if winner self-tagging should be shown (only for battle videos)
  const showWinnerSelfTagging = !isWorkshopOrSession && videoType === "battle";

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
        <div className="flex flex-col lg:flex-row h-full w-full">
          {/* Video Section */}
          <div className="flex-1 flex flex-col bg-black min-h-0">
            {/* Video Header */}
            <div className="flex items-center justify-between p-2 sm:p-4 bg-black text-white">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <h2 className="text-sm sm:text-lg font-semibold truncate">
                  {video.title}
                </h2>
                <span className="text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                  {currentIndex + 1} of {totalVideos}
                </span>
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
                  onClick={handleFullscreen}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

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
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 bg-background border-t lg:border-t-0 lg:border-l flex flex-col max-h-[40vh] lg:max-h-none">
            <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
              {/* Video Info */}
              <div className="flex flex-col gap-2">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Event</h3>
                  <Link
                    href={eventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-blue-500 hover:text-blue-600"
                  >
                    {eventTitle}
                  </Link>
                </div>
                {!isWorkshopOrSession && (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        Section
                      </h3>
                      <div>{sectionTitle}</div>
                    </div>
                    <div>
                      {bracketTitle && (
                        <>
                          <h3 className="font-semibold text-sm sm:text-base">
                            Bracket
                          </h3>
                          <div>{bracketTitle}</div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* <div className="space-y-2 sm:space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  asChild
                >
                  <a href={eventLink} target="_blank" rel="noopener noreferrer">
                    {eventTitle}
                  </a>
                </Button>
              </div> */}

              <Separator />

              {/* Style Tags */}
              {displayStyles.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="font-semibold text-sm sm:text-base">
                    Dance Styles
                  </h3>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {displayStyles.map((style) => (
                      <StyleBadge key={style} style={style} />
                    ))}
                  </div>
                </div>
              )}

              {displayStyles.length > 0 && <Separator />}

              {/* Tag Self Buttons - Only show for event videos, not workshop/session videos */}
              {/* Show Dancer button for all video types, Winner button only for battle videos */}
              {!isWorkshopOrSession && currentUserId && (
                <div className="space-y-2 sm:space-y-3">
                  <TagSelfButton
                    eventId={eventId}
                    target="video"
                    targetId={video.id}
                    currentUserId={currentUserId}
                    role={VIDEO_ROLE_DANCER}
                    isUserTagged={isUserTagged}
                    showRemoveButton={true}
                    buttonLabel="Tag Self as Dancer"
                    pendingLabel="Dancer tag request pending"
                    successLabel="Tagged as Dancer"
                  />
                  {showWinnerSelfTagging && !isUserWinner && (
                    <TagSelfButton
                      eventId={eventId}
                      target="video"
                      targetId={video.id}
                      currentUserId={currentUserId}
                      role={VIDEO_ROLE_WINNER}
                      isUserTagged={isUserWinner}
                      buttonLabel="Tag Self as Winner"
                      pendingLabel="Winner tag request pending"
                      successLabel="Tagged as Winner"
                    />
                  )}
                  {showWinnerSelfTagging && isUserWinner && (
                    <TagSelfButton
                      eventId={eventId}
                      target="video"
                      targetId={video.id}
                      currentUserId={currentUserId}
                      role={VIDEO_ROLE_WINNER}
                      isUserTagged={isUserWinner}
                      showRemoveButton={true}
                      buttonLabel="Remove Winner Tag"
                      pendingLabel="Winner tag request pending"
                      successLabel="Removed Winner Tag"
                    />
                  )}
                </div>
              )}

              {!isWorkshopOrSession &&
                ((showWinnerSelfTagging && isUserWinner) || currentUserId) && (
                  <Separator />
                )}

              {/* Winners - Only show for battle videos in events, not workshop/session videos */}
              {!isWorkshopOrSession &&
                videoType === "battle" &&
                winners.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
                      <h3 className="font-semibold text-sm sm:text-base">
                        Winners
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {winners.map((winner: UserSearchItem) => (
                        <Link
                          key={winner.username}
                          href={`/profiles/${winner.username}`}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <Badge
                            variant="default"
                            className="bg-yellow-500 hover:bg-yellow-600 text-xs cursor-pointer"
                          >
                            <Trophy className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                            {winner.displayName}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              {!isWorkshopOrSession &&
                videoType === "battle" &&
                winners.length > 0 && <Separator />}

              {/* Choreographers - Only show for choreography videos */}
              {!isWorkshopOrSession &&
                videoType === "choreography" &&
                choreographers.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <h3 className="font-semibold text-sm sm:text-base">
                        Choreographers
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {choreographers.map(
                        (choreographer: UserSearchItem, index: number) => (
                          <Link
                            key={choreographer.username || index}
                            href={`/profiles/${choreographer.username}`}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Badge
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-secondary/80"
                            >
                              {choreographer.displayName}
                            </Badge>
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                )}

              {!isWorkshopOrSession &&
                videoType === "choreography" &&
                choreographers.length > 0 && <Separator />}

              {/* Teachers - Only show for class videos */}
              {!isWorkshopOrSession &&
                videoType === "class" &&
                teachers.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <h3 className="font-semibold text-sm sm:text-base">
                        Teachers
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {teachers.map(
                        (teacher: UserSearchItem, index: number) => (
                          <Link
                            key={teacher.username || index}
                            href={`/profiles/${teacher.username}`}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Badge
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-secondary/80"
                            >
                              {teacher.displayName}
                            </Badge>
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                )}

              {!isWorkshopOrSession &&
                videoType === "class" &&
                teachers.length > 0 && <Separator />}

              {/* Dancers - Show for all video types that have dancers */}
              {!isWorkshopOrSession && dancers.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <h3 className="font-semibold text-sm sm:text-base">
                      Dancers
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {dancers.map(
                      (participant: UserSearchItem, index: number) => (
                        <Link
                          key={participant.username || index}
                          href={`/profiles/${participant.username}`}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <Badge
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-secondary/80"
                          >
                            {participant.displayName}
                          </Badge>
                        </Link>
                      )
                    )}
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
