"use client";

import {
  Video,
  BattleVideo as BattleVideoType,
  FreestyleVideo as FreestyleVideoType,
  ChoreographyVideo as ChoreographyVideoType,
  ClassVideo as ClassVideoType,
} from "@/types/video";
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

  const baseProps = {
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
      return <BattleVideo {...baseProps} video={video as BattleVideoType} />;
    case "freestyle":
      return (
        <FreestyleVideo {...baseProps} video={video as FreestyleVideoType} />
      );
    case "choreography":
      return (
        <ChoreographyVideo
          {...baseProps}
          video={video as ChoreographyVideoType}
        />
      );
    case "class":
      return <ClassVideo {...baseProps} video={video as ClassVideoType} />;
    default:
      // Default to BattleVideo for backwards compatibility
      return <BattleVideo {...baseProps} video={video as BattleVideoType} />;
  }
}
