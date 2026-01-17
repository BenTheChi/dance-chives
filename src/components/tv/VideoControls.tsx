"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoControlsProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onRestart: () => void;
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
  onRewind,
  onFastForward,
  onRestart,
  isPlaying,
  isMuted,
  className,
}: VideoControlsProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-3 w-full px-4", className)}
    >
      {/* Control Buttons */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Playback Controls - Visible on All Devices */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRestart}
            className="h-10 w-10"
            aria-label="Restart video"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onRewind}
            className="h-10 w-10"
            aria-label="Rewind 10 seconds"
          >
            <SkipBack className="h-5 w-5" />
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
            onClick={onFastForward}
            className="h-10 w-10"
            aria-label="Fast forward 10 seconds"
          >
            <SkipForward className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onMuteToggle}
            className="h-10 w-10"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
        </div>

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

          {/* Left/Right Navigation Group */}
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
      </div>
    </div>
  );
}
