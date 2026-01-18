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
}

export function VideoInfoDialog({
  isOpen,
  onClose,
  eventTitle,
  eventId,
  section,
  bracket,
  video,
}: VideoInfoDialogProps) {
  // Get all tagged dancers (combine all tag types)
  const allTaggedDancers: UserSearchItem[] = [
    ...(video.taggedDancers || []),
    ...(video.taggedWinners || []),
    ...(video.taggedChoreographers || []),
    ...(video.taggedTeachers || []),
  ];

  // Get styles (from video or section)
  const styles = video.styles || section.styles || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col items-start">
          <h2 className="!text-lg font-bold">{video.title}</h2>
              <Link href={`/events/${eventId}`} className="text-primary-light hover:text-primary-light/80 underline">  {eventTitle}</Link>
              <div className="flex flex-row gap-1 items-center">
              <Link href={`/events/${eventId}/sections/${section.id}`} className="text-primary-light hover:text-primary-light/80 underline"> {section.title}</Link>
              {bracket && (
               <p>- {bracket.title}</p>
            )}</div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Tagged Dancers */}
          {allTaggedDancers.length > 0 && (
            <div className="flex flex-col justify-center items-center">
              <div className="flex flex-wrap gap-2">
                <p className="font-semibold text-sm mb-2">Dancers</p>          
                <TagUserCircleButton eventId={eventId} target="video" targetId={video.id} size="sm" />
              </div>

              <div className="flex flex-wrap gap-3">
                {allTaggedDancers.map((dancer) => (
                  <div key={dancer.id || dancer.username} className="flex flex-col items-center gap-1">
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
            </div>
          )}

          {/* Tagged Winners */}
          {video.taggedWinners && video.taggedWinners.length > 0 && (
            <div className="flex flex-col justify-center items-center">
              <div className="flex flex-wrap gap-2">
                <p className="font-semibold text-sm mb-2">Winners</p>
                {video.taggedWinners.map((winner) => (
                  <div key={winner.id || winner.username} className="flex flex-col items-center gap-1">
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
