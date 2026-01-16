"use client";

import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoControlsProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  isPlaying: boolean;
  isMuted: boolean;
  className?: string;
}

export function VideoControls({
  onUp,
  onDown,
  onLeft,
  onRight,
  onPlayPause,
  onMuteToggle,
  isPlaying,
  isMuted,
  className,
}: VideoControlsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {/* Desktop Navigation Controls - Hidden on Mobile */}
      <div className="hidden md:flex items-center gap-2">
        {/* Up Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onUp}
          className="h-10 w-10"
          aria-label="Previous video"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>

        {/* Left/Right/PlayPause Group */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onLeft}
            className="h-10 w-10"
            aria-label="Previous section"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={onPlayPause}
            className="h-10 w-10"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onRight}
            className="h-10 w-10"
            aria-label="Next section"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Down Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onDown}
          className="h-10 w-10"
          aria-label="Next video"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Mute/Unmute Button - Always Visible */}
      <Button
        variant="outline"
        size="icon"
        onClick={onMuteToggle}
        className="h-10 w-10 md:ml-2"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
