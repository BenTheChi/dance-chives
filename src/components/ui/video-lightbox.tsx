"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import {
  BattleVideo,
  ChoreographyVideo,
  ClassVideo,
  Video,
} from "@/types/video";
import { UserSearchItem } from "@/types/user";
import { TagUserCircleButton } from "@/components/events/TagUserCircleButton";
import { VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER } from "@/lib/utils/roles";
import { extractYouTubeVideoId } from "@/lib/utils";
import { removeTagFromVideo } from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTransition } from "react";
import Link from "next/link";
import { MaintenanceLink } from "@/components/MaintenanceLink";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

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
  sectionSlug?: string;
  bracketTitle?: string;
  sectionStyles?: string[];
  applyStylesToVideos?: boolean;
  currentUserId?: string;
  canEdit?: boolean;
  enableUrlRouting?: boolean;
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
  sectionSlug,
  bracketTitle,
  sectionStyles,
  applyStylesToVideos,
  currentUserId,
  canEdit = false,
  enableUrlRouting = false,
}: VideoLightboxProps) {
  const [pendingRemoval, setPendingRemoval] = useState<{
    user: UserSearchItem;
    roleLabel: string;
  } | null>(null);
  const [isRemoving, startRemoval] = useTransition();
  const router = useRouter();
  const requestRemoval = (user: UserSearchItem, roleLabel: string) => {
    setPendingRemoval({ user, roleLabel });
  };
  const confirmPendingRemoval = () => {
    if (!pendingRemoval) return;
    const targetUser = pendingRemoval.user;
    startRemoval(async () => {
      try {
        await removeTagFromVideo(
          eventId,
          video.id,
          targetUser.id || targetUser.username
        );
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
    setPendingRemoval(null);
  };

  const canRemoveUser = (user: UserSearchItem) => {
    const userId = user.id || user.username;
    if (!eventId || !currentUserId) return false;
    const isSelf =
      currentUserId === userId ||
      currentUserId === user.id ||
      currentUserId === user.username;
    return isSelf || Boolean(canEdit && currentUserId);
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
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  // State for spoiler functionality - winners hidden by default
  const [showWinners, setShowWinners] = useState(false);

  // Swipe gesture state
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check if screen is small
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640); // sm breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Reset drag state when video changes or dialog closes
  useEffect(() => {
    if (!isOpen) {
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
      setIsTransitioning(false);
    }
  }, [isOpen, video.id]);

  // Sync refs with state
  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Swipe gesture handlers (using native events to allow preventDefault)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isSmallScreen || !isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      touchEndRef.current = null;
      setIsDragging(true);
      setIsTransitioning(false);
      setDragOffset({ x: 0, y: 0 });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !isDraggingRef.current) return;
      const touch = e.touches[0];
      let deltaX = touch.clientX - touchStartRef.current.x;
      let deltaY = touch.clientY - touchStartRef.current.y;

      // Prevent default scrolling if horizontal drag is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
      }

      // Add resistance/elasticity when dragging beyond limits
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Horizontal resistance - reduce drag if trying to go beyond available videos
      if (deltaX > 0 && !hasPrev) {
        // Dragging right but no previous video - add resistance
        deltaX = deltaX * 0.3;
      } else if (deltaX < 0 && !hasNext) {
        // Dragging left but no next video - add resistance
        deltaX = deltaX * 0.3;
      } else if (Math.abs(deltaX) > screenWidth * 0.5) {
        // Add slight resistance when dragging very far
        const excess = Math.abs(deltaX) - screenWidth * 0.5;
        deltaX =
          deltaX > 0
            ? screenWidth * 0.5 + excess * 0.3
            : -(screenWidth * 0.5 + excess * 0.3);
      }

      // Vertical resistance - add resistance when dragging very far
      if (Math.abs(deltaY) > screenHeight * 0.5) {
        const excess = Math.abs(deltaY) - screenHeight * 0.5;
        deltaY =
          deltaY > 0
            ? screenHeight * 0.5 + excess * 0.3
            : -(screenHeight * 0.5 + excess * 0.3);
      }

      // Update drag offset in real-time
      const newOffset = { x: deltaX, y: deltaY };
      setDragOffset(newOffset);
      dragOffsetRef.current = newOffset;
      touchEndRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !isDraggingRef.current) return;

      const deltaX = dragOffsetRef.current.x;
      const deltaY = dragOffsetRef.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Minimum swipe distance threshold (50px)
      const minSwipeDistance = 50;
      // Threshold for completing the transition (30% of screen width/height)
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const completeThresholdX = screenWidth * 0.3;
      const completeThresholdY = screenHeight * 0.3;

      setIsDragging(false);
      setIsTransitioning(true);

      // Determine if horizontal or vertical swipe is dominant
      if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
        // Horizontal swipe - navigate videos
        if (deltaX > 0 && hasPrev && absDeltaX > completeThresholdX) {
          // Swipe right - go to previous video
          setDragOffset({ x: screenWidth, y: 0 });
          setTimeout(() => {
            onPrev();
            setDragOffset({ x: 0, y: 0 });
            setIsTransitioning(false);
          }, 300);
        } else if (deltaX < 0 && hasNext && absDeltaX > completeThresholdX) {
          // Swipe left - go to next video
          setDragOffset({ x: -screenWidth, y: 0 });
          setTimeout(() => {
            onNext();
            setDragOffset({ x: 0, y: 0 });
            setIsTransitioning(false);
          }, 300);
        } else {
          // Snap back
          setDragOffset({ x: 0, y: 0 });
          setTimeout(() => setIsTransitioning(false), 300);
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > minSwipeDistance) {
        // Vertical swipe - close video
        if (absDeltaY > completeThresholdY) {
          // Complete close animation (swipe down closes)
          setDragOffset({ x: 0, y: deltaY > 0 ? screenHeight : -screenHeight });
          setTimeout(() => {
            onClose();
            setDragOffset({ x: 0, y: 0 });
            setIsTransitioning(false);
          }, 300);
        } else {
          // Snap back
          setDragOffset({ x: 0, y: 0 });
          setTimeout(() => setIsTransitioning(false), 300);
        }
      } else {
        // No significant swipe - snap back
        setDragOffset({ x: 0, y: 0 });
        setTimeout(() => setIsTransitioning(false), 300);
      }

      // Reset touch positions
      touchStartRef.current = null;
      touchEndRef.current = null;
    };

    // Attach event listeners with { passive: false } to allow preventDefault
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isSmallScreen, isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

  // Get video type, defaulting to "battle" for backwards compatibility
  const videoType = video?.type || "battle";

  // Get tagged users based on video type
  const winners =
    ((videoType === "battle" || videoType === "other") &&
      (video as BattleVideo)?.taggedWinners) ||
    [];
  const dancers = (video as Video)?.taggedDancers || [];
  const choreographers =
    ((videoType === "choreography" || videoType === "other") &&
      (video as ChoreographyVideo)?.taggedChoreographers) ||
    [];
  const teachers =
    ((videoType === "class" || videoType === "other") &&
      (video as ClassVideo)?.taggedTeachers) ||
    [];

  // For user comparisons, we need to check by username if currentUserId is a username
  // or by id if currentUserId is an id. Since currentUserId comes from session, it's likely an id.
  // But we'll check both username and id for compatibility
  const isUserWinner =
    currentUserId && (videoType === "battle" || videoType === "other")
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
    currentUserId && (videoType === "choreography" || videoType === "other")
      ? choreographers.some(
          (user: UserSearchItem) =>
            user.id === currentUserId || user.username === currentUserId
        )
      : false;
  const isUserTeacher =
    currentUserId && (videoType === "class" || videoType === "other")
      ? teachers.some(
          (user: UserSearchItem) =>
            user.id === currentUserId || user.username === currentUserId
        )
      : false;

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
        className="h-[360px] sm:h-[98vh] p-0 gap-0 !max-w-[100vw] sm:!max-w-[80vw] !w-[100vw] sm:!w-[95vw] bg-transparent border-none overflow-hidden"
      >
        <div
          ref={containerRef}
          className="flex flex-col h-full w-full bg-black"
          style={{
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
            transition: isTransitioning ? "transform 0.3s ease-out" : "none",
            touchAction: isSmallScreen ? "pan-y pan-x" : "auto",
          }}
        >
          {/* Video Header */}
          <div className="pt-2 px-4 bg-black text-white border-b border-white/10">
            {/* First line: Title, metadata, and controls */}
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center flex-wrap gap-2 sm:gap-4 min-w-0 flex-1">
                <h2 className="!text-[14px] sm:text-lg font-semibold whitespace-wrap">
                  {video.title}
                </h2>
                <span className="text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                  {currentIndex + 1} of {totalVideos}
                </span>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300">
                  <MaintenanceLink
                    href={eventLink}
                    className="whitespace-nowrap"
                  >
                    {eventTitle}
                  </MaintenanceLink>

                  {sectionSlug && (
                    <>
                      <span>•</span>
                      <MaintenanceLink
                        href={`/events/${eventId}/sections/${sectionSlug}`}
                        className="whitespace-nowrap"
                      >
                        {sectionTitle}
                      </MaintenanceLink>
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

              <div className="items-center space-x-1 sm:space-x-2 flex-shrink-0 hidden sm:flex">
                {hasPrev && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrev}
                    className="text-white hover:bg-fog-white/20 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}

                {hasNext && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNext}
                    className="text-white hover:bg-fog-white/20 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-fog-white/20 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            {/* Second line: Style tags */}
            {displayStyles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 py-1 sm:py-2">
                {displayStyles.map((style) => (
                  <StyleBadge key={style} style={style} />
                ))}
              </div>
            )}
          </div>

          {/* Video Player */}
          <div className="flex-1 relative min-h-[200px] sm:min-h-[300px] border-t border-b border-white/50">
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
                  loading="lazy"
                />
              );
            })()}
          </div>

          {/* Tagged Users Below Video */}
          <div className="bg-black/90 text-white p-3 sm:p-4 border-t border-white/10">
            <div className="flex flex-nowrap items-start justify-start gap-10">
              {/* Tag Self Button */}
              <div className="flex-shrink-0">
                <TagUserCircleButton
                  eventId={eventId}
                  target="video"
                  targetId={video.id}
                  videoType={
                    videoType as "battle" | "choreography" | "class" | "other"
                  }
                  currentVideoRoles={[
                    ...(isUserDancer ? [VIDEO_ROLE_DANCER] : []),
                    ...(isUserWinner ? [VIDEO_ROLE_WINNER] : []),
                    ...(isUserChoreographer ? ["Choreographer"] : []),
                    ...(isUserTeacher ? ["Teacher"] : []),
                  ]}
                />
              </div>

              {/* Dancers - Show for all video types */}
              {dancers.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">Dancers</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-2">
                      {dancers.map((dancer: UserSearchItem, index: number) => (
                        <UserAvatar
                          key={dancer.username || index}
                          username={dancer.username}
                          displayName={dancer.displayName}
                          avatar={(dancer as any).avatar}
                          image={(dancer as any).image}
                          showHoverCard
                          city={(dancer as any).city || ""}
                          styles={(dancer as any).styles}
                          borderColor="white"
                          isSmall={true}
                          showRemoveButton={canRemoveUser(dancer)}
                          onRemove={() => requestRemoval(dancer, "dancer")}
                          isRemoving={isRemoving}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Winners - Show for battle and other videos */}
              {(videoType === "battle" || videoType === "other") &&
                winners.length > 0 && (
                  <div className="flex-shrink-0">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">
                          Winners{" "}
                          <Button
                            variant="link"
                            className="text-xs text-gray-400 hover:text-white p-0 h-auto"
                            onClick={() => setShowWinners(!showWinners)}
                          >
                            ({showWinners ? "hide" : "show"})
                          </Button>
                        </h3>
                      </div>
                      {showWinners && (
                        <div className="flex flex-wrap gap-2 ml-2">
                          {winners.map((winner: UserSearchItem) => (
                            <UserAvatar
                              key={winner.username}
                              username={winner.username}
                              displayName={winner.displayName}
                              avatar={(winner as any).avatar}
                              image={(winner as any).image}
                              showHoverCard
                              city={(winner as any).city || ""}
                              styles={(winner as any).styles}
                              borderColor="white"
                              isSmall={true}
                              showRemoveButton={canRemoveUser(winner)}
                              onRemove={() =>
                                requestRemoval(winner, "winner")
                              }
                              isRemoving={isRemoving}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Choreographers - Show for choreography and other videos */}
              {(videoType === "choreography" || videoType === "other") &&
                choreographers.length > 0 && (
                  <div className="flex-shrink-0">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">
                          Choreographers
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-2">
                        {choreographers.map(
                          (choreographer: UserSearchItem, index: number) => (
                            <UserAvatar
                              key={choreographer.username || index}
                              username={choreographer.username}
                              displayName={choreographer.displayName}
                              avatar={(choreographer as any).avatar}
                              image={(choreographer as any).image}
                              showHoverCard
                              city={(choreographer as any).city || ""}
                              styles={(choreographer as any).styles}
                              borderColor="white"
                              isSmall={true}
                              showRemoveButton={canRemoveUser(choreographer)}
                              onRemove={() =>
                                requestRemoval(choreographer, "choreographer")
                              }
                              isRemoving={isRemoving}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Teachers - Show for class and other videos */}
              {(videoType === "class" || videoType === "other") &&
                teachers.length > 0 && (
                  <div className="flex-shrink-0">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Teachers</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-2">
                        {teachers.map(
                          (teacher: UserSearchItem, index: number) => (
                            <UserAvatar
                              key={teacher.username || index}
                              username={teacher.username}
                              displayName={teacher.displayName}
                              avatar={(teacher as any).avatar}
                              image={(teacher as any).image}
                              showHoverCard
                              city={(teacher as any).city || ""}
                              styles={(teacher as any).styles}
                              borderColor="white"
                              isSmall={true}
                              showRemoveButton={canRemoveUser(teacher)}
                              onRemove={() =>
                                requestRemoval(teacher, "teacher")
                              }
                              isRemoving={isRemoving}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </DialogContent>
      <ConfirmationDialog
        open={Boolean(pendingRemoval)}
        title={`Remove ${pendingRemoval?.roleLabel || "tag"}`}
        description={`Remove ${
          pendingRemoval
            ? pendingRemoval.user.displayName ||
              pendingRemoval.user.username ||
              "this user"
            : "this user"
        } from the video?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        loading={isRemoving}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={confirmPendingRemoval}
      />
    </Dialog>
  );
}
