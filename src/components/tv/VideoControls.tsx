"use client";

import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Rewind,
  FastForward,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoReacts } from "./VideoReacts";

interface UserReacts {
  fire: number;
  clap: number;
  wow: number;
  heart: number;
}

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
  // Video Reacts props
  videoId?: string;
  currentTime?: number;
  onReact?: (type: string, timestamp: number) => void;
  userReacts?: UserReacts | null;
  onReset?: () => void;
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
  videoId,
  currentTime = 0,
  onReact,
  userReacts,
  onReset,
}: VideoControlsProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-3 w-full px-4", className)}
    >
      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center sm:items-start gap-3 w-full px-6">
        {/* Video Reacts - Visible on sm screens and above */}
        {videoId && onReact && onReset && (
          <div className="hidden sm:block">
            <VideoReacts
              videoId={videoId}
              currentTime={currentTime}
              onReact={onReact}
              userReacts={userReacts || null}
              onReset={onReset}
            />
          </div>
        )}

        {/* Playback Controls - Visible on All Devices */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onRestart}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Restart video"
          >
            <RotateCcw className="h-6 w-6 text-accent-yellow/80 hover:text-accent-yellow/50 transition-colors" />
          </button>

          <button
            onClick={onRewind}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Rewind 10 seconds"
          >
            <Rewind className="h-6 w-6 text-primary-light hover:text-primary-light/80 transition-colors" />
          </button>

          <button
            onClick={onPlayPause}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-7 w-7 text-accent-blue/80 hover:text-accent-blue/50 transition-colors" />
            ) : (
              <Play className="h-7 w-7 text-accent-blue/80 hover:text-accent-blue/50 transition-colors" />
            )}
          </button>

          <button
            onClick={onFastForward}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Fast forward 10 seconds"
          >
            <FastForward className="h-6 w-6 text-primary-light hover:text-primary-light/80 transition-colors" />
          </button>

          <button
            onClick={onMuteToggle}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-6 w-6 text-red-400 hover:text-red-300 transition-colors" />
            ) : (
              <Volume2 className="h-6 w-6 text-purple-400 hover:text-purple-300 transition-colors" />
            )}
          </button>
        </div>

        {/* Desktop Navigation Controls - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-3">
          {/* Up Button */}
          <button
            onClick={onUp}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Previous video"
          >
            <ArrowUp className="h-6 w-6 text-yellow-400 hover:text-yellow-300 transition-colors" />
          </button>

          {/* Left/Right Navigation Group */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLeft}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Previous section"
            >
              <ArrowLeft className="h-6 w-6 text-orange-400 hover:text-orange-300 transition-colors" />
            </button>

            <button
              onClick={onRight}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Next section"
            >
              <ArrowRight className="h-6 w-6 text-orange-400 hover:text-orange-300 transition-colors" />
            </button>
          </div>

          {/* Down Button */}
          <button
            onClick={onDown}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Next video"
          >
            <ArrowDown className="h-6 w-6 text-yellow-400 hover:text-yellow-300 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
