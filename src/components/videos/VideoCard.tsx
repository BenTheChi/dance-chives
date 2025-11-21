"use client";

import { Video } from "@/types/video";
import { BattleVideo } from "./BattleVideo";
import { FreestyleVideo } from "./FreestyleVideo";
import { ChoreographyVideo } from "./ChoreographyVideo";
import { ClassVideo } from "./ClassVideo";

interface VideoCardProps {
  video: Video;
  eventLink: string;
  eventTitle: string;
  sectionTitle?: string;
  bracketTitle?: string;
  onClick: () => void;
  styles?: string[];
  currentUserId?: string;
}

export function VideoCard({
  video,
  eventLink,
  eventTitle,
  sectionTitle,
  bracketTitle,
  onClick,
  styles,
  currentUserId,
}: VideoCardProps) {
  const videoType = video.type || "battle";

  const commonProps = {
    video: video as any,
    eventLink,
    eventTitle,
    sectionTitle,
    bracketTitle,
    onClick,
    styles,
    currentUserId,
  };

  switch (videoType) {
    case "battle":
      return <BattleVideo {...commonProps} />;
    case "freestyle":
      return <FreestyleVideo {...commonProps} />;
    case "choreography":
      return <ChoreographyVideo {...commonProps} />;
    case "class":
      return <ClassVideo {...commonProps} />;
    default:
      // Default to BattleVideo for backwards compatibility
      return <BattleVideo {...commonProps} />;
  }
}

