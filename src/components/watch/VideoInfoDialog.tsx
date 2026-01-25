"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Video } from "@/types/video";
import { Section, Bracket } from "@/types/event";
import { UserSearchItem } from "@/types/user";
import { TagUserCircleButton } from "@/components/events/TagUserCircleButton";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { removeTagFromVideo } from "@/lib/server_actions/request_actions";

interface VideoInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventId: string;
  section: Section;
  bracket?: Bracket;
  video: Video;
  city?: string;
  eventDate?: string; // Formatted as "Mar 2026"
  container?: HTMLElement | null;
  onVideoUpdate?: (videoId: string, role: string, users: UserSearchItem[]) => void;
  onVideoRemove?: (videoId: string, userId: string, role: string) => void;
}

export function VideoInfoDialog({
  isOpen,
  onClose,
  eventTitle,
  eventId,
  section,
  bracket,
  video,
  city,
  eventDate,
  container,
  onVideoUpdate,
  onVideoRemove,
}: VideoInfoDialogProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const currentUserId = session?.user?.id;

  // Helper to determine which role a user has based on which section they're displayed in
  const getUserRole = (
    userId: string,
    isInDancersList: boolean
  ): string | null => {
    if (isInDancersList) {
      // Check dancer, choreographer, teacher (in order of priority for display)
      if (
        video.taggedChoreographers?.some(
          (c) => c.id === userId || c.username === userId
        )
      ) {
        return "Choreographer";
      }
      if (
        video.taggedTeachers?.some(
          (t) => t.id === userId || t.username === userId
        )
      ) {
        return "Teacher";
      }
      if (
        video.taggedDancers?.some(
          (d) => d.id === userId || d.username === userId
        )
      ) {
        return "Dancer";
      }
    } else {
      // In winners list
      if (
        video.taggedWinners?.some(
          (w) => w.id === userId || w.username === userId
        )
      ) {
        return "Winner";
      }
    }
    return null;
  };

  // Check if user can remove a tag
  const canRemoveTag = (userId: string): boolean => {
    if (!currentUserId || !eventId) return false;
    // User can remove their own tag, or we assume they have edit permissions if onVideoRemove is provided
    return currentUserId === userId || !!onVideoRemove;
  };

  // Handle removing a tag
  const handleRemoveTag = (userId: string, role: string) => {
    if (!eventId || !currentUserId) return;

    startTransition(async () => {
      try {
        await removeTagFromVideo(eventId, video.id, userId);
        toast.success("Tag removed successfully");
        
        // Optimistically update the video
        if (onVideoRemove) {
          onVideoRemove(video.id, userId, role);
        }
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
  // Get all tagged dancers (combine all tag types, excluding winners since they have their own section)
  const winnerIds = new Set(
    (video.taggedWinners || []).map((w) => w.id || w.username)
  );
  const allTaggedDancers: UserSearchItem[] = [
    ...(video.taggedDancers || []),
    ...(video.taggedChoreographers || []),
    ...(video.taggedTeachers || []),
  ].filter((dancer) => {
    const dancerId = dancer.id || dancer.username;
    return !winnerIds.has(dancerId);
  });

  // Get styles - use section styles if applyStylesToVideos is true, otherwise use video styles
  const styles =
    section.applyStylesToVideos && section.styles && section.styles.length > 0
      ? section.styles
      : video.styles || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" container={container || undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">{video.title}</DialogTitle>
          <div className="flex flex-col items-center">
            <Link
              href={`/events/${eventId}`}
              className="text-primary-light hover:text-primary-light/80 underline"
            >
              {" "}
              <h2 className="!text-lg font-bold">{eventTitle}</h2>
            </Link>
            <div className="flex flex-row gap-2 items-baseline">
              {city && <p>{city}</p>}
              {eventDate && <p>- {eventDate}</p>}
            </div>
            <br />
            <Link
              href={`/events/${eventId}/sections/${section.id}`}
              className="text-primary-light hover:text-primary-light/80 underline"
            >
              {" "}
              <h3 className="!text-lg font-bold">{section.title}</h3>
            </Link>
            <div className="flex flex-row gap-1 items-baseline">
              {bracket && <p> {bracket.title}</p>}
              <p>- {video.title}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Dance Styles */}
          {styles.length > 0 && (
            <div className="flex flex-col justify-center items-center">
              <p className="font-semibold text-sm mb-2">Dance Styles</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {styles.map((style) => (
                  <StyleBadge key={style} style={style} asLink={false} />
                ))}
              </div>
            </div>
          )}

          {/* Tagged Dancers */}
          <div className="flex flex-col justify-center items-center">
            <div className="flex flex-wrap gap-2">
              <p className="font-semibold text-sm mb-2">Dancers</p>
              <TagUserCircleButton
                eventId={eventId}
                target="video"
                targetId={video.id}
                size="sm"
                videoType={video.type as "battle" | "choreography" | "class" | "other"}
                currentVideoRoles={[
                  ...(video.taggedDancers?.length ? ["Dancer"] : []),
                  ...(video.taggedWinners?.length ? ["Winner"] : []),
                  ...(video.taggedChoreographers?.length ? ["Choreographer"] : []),
                  ...(video.taggedTeachers?.length ? ["Teacher"] : []),
                ]}
                onUsersTagged={(users, role) => {
                  if (onVideoUpdate) {
                    onVideoUpdate(video.id, role, users);
                  }
                }}
              />
            </div>

            {allTaggedDancers.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {allTaggedDancers.map((dancer) => {
                  const dancerId = dancer.id || dancer.username;
                  const role = getUserRole(dancerId, true);
                  const canRemove = canRemoveTag(dancerId);
                  return (
                    <div
                      key={dancerId}
                      className="flex flex-col items-center gap-1 rounded-full"
                    >
                      <UserAvatar
                        username={dancer.username}
                        displayName={dancer.displayName}
                        avatar={dancer.avatar}
                        image={dancer.image}
                        showHoverCard
                        city="" // Will be populated from hover card
                        styles={[]}
                        isSmall={true}
                        showRemoveButton={canRemove && role !== null}
                        onRemove={() => role && handleRemoveTag(dancerId, role)}
                        isRemoving={isPending}
                      />
                      <span className="!text-xs text-muted-foreground text-center max-w-[60px] truncate">
                        {dancer.displayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tagged Winners */}
          {video.taggedWinners && video.taggedWinners.length > 0 && (
            <div className="flex flex-col justify-center items-center">
              <div className="flex flex-wrap gap-2">
                <p className="font-semibold text-sm mb-2">Winners</p>
                {video.taggedWinners.map((winner) => {
                  const winnerId = winner.id || winner.username;
                  const role = getUserRole(winnerId, false);
                  const canRemove = canRemoveTag(winnerId);
                  return (
                    <div
                      key={winnerId}
                      className="flex flex-col items-center gap-1"
                    >
                      <UserAvatar
                        username={winner.username}
                        displayName={winner.displayName}
                        avatar={winner.avatar}
                        image={winner.image}
                        city=""
                        styles={[]}
                        isSmall={true}
                        showRemoveButton={canRemove && role !== null}
                        onRemove={() => role && handleRemoveTag(winnerId, role)}
                        isRemoving={isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
