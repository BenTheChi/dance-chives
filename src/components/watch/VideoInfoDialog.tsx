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
}: VideoInfoDialogProps) {
  // Get all tagged dancers (combine all tag types)
  const allTaggedDancers: UserSearchItem[] = [
    ...(video.taggedDancers || []),
    ...(video.taggedWinners || []),
    ...(video.taggedChoreographers || []),
    ...(video.taggedTeachers || []),
  ];

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
                  <StyleBadge key={style} style={style} asLink={true} />
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
              />
            </div>

            {allTaggedDancers.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {allTaggedDancers.map((dancer) => (
                  <div
                    key={dancer.id || dancer.username}
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
                    />
                    <span className="!text-xs text-muted-foreground text-center max-w-[60px] truncate">
                      {dancer.displayName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tagged Winners */}
          {video.taggedWinners && video.taggedWinners.length > 0 && (
            <div className="flex flex-col justify-center items-center">
              <div className="flex flex-wrap gap-2">
                <p className="font-semibold text-sm mb-2">Winners</p>
                {video.taggedWinners.map((winner) => (
                  <div
                    key={winner.id || winner.username}
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
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
