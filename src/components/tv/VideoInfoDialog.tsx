"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Video } from "@/types/video";
import { Section, Bracket } from "@/types/event";
import { UserSearchItem } from "@/types/user";
import Link from "next/link";
import { Tag } from "lucide-react";

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

  // Build tag URL - link to the event section page with video context
  const tagUrl = `/events/${eventId}/sections/${section.id}${bracket ? `?bracket=${bracket.id}` : ""}#video-${video.id}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{video.title}</DialogTitle>
          <DialogDescription className="space-y-2">
            <div>
              <p className="font-semibold text-foreground">Event</p>
              <p className="text-sm">{eventTitle}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Section</p>
              <p className="text-sm">{section.title}</p>
            </div>
            {bracket && (
              <div>
                <p className="font-semibold text-foreground">Bracket</p>
                <p className="text-sm">{bracket.title}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Style Badges */}
          {styles.length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2">Styles</p>
              <div className="flex flex-wrap gap-2">
                {styles.map((style) => (
                  <StyleBadge key={style} style={style} asLink />
                ))}
              </div>
            </div>
          )}

          {/* Tagged Dancers */}
          {allTaggedDancers.length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2">Tagged Dancers</p>
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
                    />
                    <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
                      {dancer.displayName || dancer.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tag Button */}
          <div className="pt-4 border-t">
            <Link href={tagUrl} onClick={onClose}>
              <Button variant="outline" className="w-full">
                <Tag className="w-4 h-4 mr-2" />
                Tag Dancers
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
