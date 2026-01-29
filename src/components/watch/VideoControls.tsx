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
  Maximize,
  Minimize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoReacts } from "./VideoReacts";

interface UserReacts {
  fire: number[];
  clap: number[];
  wow: number[];
  laugh: number[];
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
  showReacts?: boolean;
  onToggleReacts?: () => void;
  maxReactsPerEmoji?: number;
  maxTotalReacts?: number;
  allowAnon?: boolean;
  // Fullscreen props
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  showFullscreenButton?: boolean;
  // Navigation state props
  canNavigateLeft?: boolean;
  canNavigateRight?: boolean;
  canNavigateUp?: boolean;
  canNavigateDown?: boolean;
  // Layout props
  isMobile?: boolean;
  isLandscape?: boolean;
  // Mobile navigation props
  showMobileNavigation?: boolean;
  // Landscape/fullscreen navigation props
  showLandscapeNavigation?: boolean;
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
  showReacts,
  onToggleReacts,
  maxReactsPerEmoji,
  maxTotalReacts,
  allowAnon,
  onToggleFullscreen,
  isFullscreen = false,
  showFullscreenButton = false,
  canNavigateLeft = true,
  canNavigateRight = true,
  canNavigateUp = true,
  canNavigateDown = true,
  isMobile = false,
  isLandscape = false,
  showMobileNavigation = false,
  showLandscapeNavigation = false,
}: VideoControlsProps) {
  // If showing landscape navigation, only render that
  if (showLandscapeNavigation) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onUp}
          disabled={!canNavigateUp}
          className={cn(
            "p-1 rounded-lg transition-colors",
            isFullscreen && "p-2",
            canNavigateUp
              ? "hover:bg-white/10"
              : "opacity-50 cursor-not-allowed"
          )}
          aria-label="Previous video"
        >
          <ArrowUp
            className={cn(
              "h-6 w-6",
              isFullscreen && "h-12 w-12",
              canNavigateUp ? "text-yellow-400" : "text-gray-500"
            )}
          />
        </button>
        <button
          onClick={onDown}
          disabled={!canNavigateDown}
          className={cn(
            "p-1 rounded-lg transition-colors",
            isFullscreen && "p-2",
            canNavigateDown
              ? "hover:bg-white/10"
              : "opacity-50 cursor-not-allowed"
          )}
          aria-label="Next video"
        >
          <ArrowDown
            className={cn(
              "h-6 w-6",
              isFullscreen && "h-12 w-12",
              canNavigateDown ? "text-yellow-400" : "text-gray-500"
            )}
          />
        </button>

        <button
          onClick={onRight}
          disabled={!canNavigateRight}
          className={cn(
            "p-1 rounded-lg transition-colors",
            isFullscreen && "p-2",
            canNavigateRight
              ? "hover:bg-white/10"
              : "opacity-50 cursor-not-allowed"
          )}
          aria-label="Next section"
        >
          <ArrowRight
            className={cn(
              "h-6 w-6",
              isFullscreen && "h-12 w-12",
              canNavigateRight ? "text-orange-400" : "text-gray-500"
            )}
          />
        </button>
        <button
          onClick={onLeft}
          disabled={!canNavigateLeft}
          className={cn(
            "p-1 rounded-lg transition-colors",
            isFullscreen && "p-2",
            canNavigateLeft
              ? "hover:bg-white/10"
              : "opacity-50 cursor-not-allowed"
          )}
          aria-label="Previous section"
        >
          <ArrowLeft
            className={cn(
              "h-6 w-6",
              isFullscreen && "h-12 w-12",
              canNavigateLeft ? "text-orange-400" : "text-gray-500"
            )}
          />
        </button>
        {!(isLandscape && !isPlaying) && (
          <button
            onClick={onMuteToggle}
            className={cn(
              "p-2 rounded-lg hover:bg-white/10 transition-colors",
              isFullscreen && "p-4"
            )}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX
                className={cn(
                  "h-6 w-6 text-red-400 hover:text-red-300 transition-colors",
                  isFullscreen && "h-12 w-12"
                )}
              />
            ) : (
              <Volume2
                className={cn(
                  "h-6 w-6 text-purple-400 hover:text-purple-300 transition-colors",
                  isFullscreen && "h-12 w-12"
                )}
              />
            )}
          </button>
        )}
        {isFullscreen && onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-4 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Exit fullscreen"
          >
            <Minimize className="h-12 w-12 text-green-400 hover:text-green-300 transition-colors" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center w-full px-4", className)}>
      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center sm:items-start gap-3 w-full px-6 pt-3">
        {/* Video Reacts - Visible on sm screens and above */}
        {videoId && onReact && onReset && (
          <div className="hidden sm:block">
            <VideoReacts
              videoId={videoId}
              currentTime={currentTime}
              onReact={onReact}
              userReacts={userReacts || null}
              onReset={onReset}
              showReacts={showReacts ?? true}
              onToggleReacts={onToggleReacts || (() => {})}
              maxReactsPerEmoji={maxReactsPerEmoji}
              maxTotalReacts={maxTotalReacts}
              allowAnon={allowAnon}
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

          {/* Fullscreen Button - Only visible for non-mobile, non-landscape */}
          {showFullscreenButton && onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-6 w-6 text-green-400 hover:text-green-300 transition-colors" />
              ) : (
                <Maximize className="h-6 w-6 text-green-400 hover:text-green-300 transition-colors" />
              )}
            </button>
          )}
        </div>

        {/* Desktop Navigation Controls - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-3">
          {/* Left/Right Navigation Group */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLeft}
              disabled={!canNavigateLeft}
              className={cn(
                "p-2 rounded-lg transition-colors",
                canNavigateLeft
                  ? "hover:bg-white/10"
                  : "opacity-50 cursor-not-allowed"
              )}
              aria-label="Previous section"
            >
              <ArrowLeft
                className={cn(
                  "h-6 w-6 transition-colors",
                  canNavigateLeft
                    ? "text-orange-400 hover:text-orange-300"
                    : "text-gray-500"
                )}
              />
            </button>
            {/* Up Button */}
            <button
              onClick={onUp}
              disabled={!canNavigateUp}
              className={cn(
                "p-2 rounded-lg transition-colors",
                canNavigateUp
                  ? "hover:bg-white/10"
                  : "opacity-50 cursor-not-allowed"
              )}
              aria-label="Previous video"
            >
              <ArrowUp
                className={cn(
                  "h-6 w-6 transition-colors",
                  canNavigateUp
                    ? "text-yellow-400 hover:text-yellow-300"
                    : "text-gray-500"
                )}
              />
            </button>
            {/* Down Button */}
            <button
              onClick={onDown}
              disabled={!canNavigateDown}
              className={cn(
                "p-2 rounded-lg transition-colors",
                canNavigateDown
                  ? "hover:bg-white/10"
                  : "opacity-50 cursor-not-allowed"
              )}
              aria-label="Next video"
            >
              <ArrowDown
                className={cn(
                  "h-6 w-6 transition-colors",
                  canNavigateDown
                    ? "text-yellow-400 hover:text-yellow-300"
                    : "text-gray-500"
                )}
              />
            </button>
            <button
              onClick={onRight}
              disabled={!canNavigateRight}
              className={cn(
                "p-2 rounded-lg transition-colors",
                canNavigateRight
                  ? "hover:bg-white/10"
                  : "opacity-50 cursor-not-allowed"
              )}
              aria-label="Next section"
            >
              <ArrowRight
                className={cn(
                  "h-6 w-6 transition-colors",
                  canNavigateRight
                    ? "text-orange-400 hover:text-orange-300"
                    : "text-gray-500"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Controls - Below Reacts on mobile */}
      {showMobileNavigation && (
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={onLeft}
            disabled={!canNavigateLeft}
            className={cn(
              "p-3 rounded-lg transition-colors",
              canNavigateLeft
                ? "bg-black/60 hover:bg-black/80"
                : "bg-black/30 opacity-50 cursor-not-allowed"
            )}
            aria-label="Previous section"
          >
            <ArrowLeft
              className={cn(
                "h-6 w-6",
                canNavigateLeft ? "text-orange-400" : "text-gray-500"
              )}
            />
          </button>
          <button
            onClick={onUp}
            disabled={!canNavigateUp}
            className={cn(
              "p-3 rounded-lg transition-colors",
              canNavigateUp
                ? "bg-black/60 hover:bg-black/80"
                : "bg-black/30 opacity-50 cursor-not-allowed"
            )}
            aria-label="Previous video"
          >
            <ArrowUp
              className={cn(
                "h-6 w-6",
                canNavigateUp ? "text-yellow-400" : "text-gray-500"
              )}
            />
          </button>
          <button
            onClick={onDown}
            disabled={!canNavigateDown}
            className={cn(
              "p-3 rounded-lg transition-colors",
              canNavigateDown
                ? "bg-black/60 hover:bg-black/80"
                : "bg-black/30 opacity-50 cursor-not-allowed"
            )}
            aria-label="Next video"
          >
            <ArrowDown
              className={cn(
                "h-6 w-6",
                canNavigateDown ? "text-yellow-400" : "text-gray-500"
              )}
            />
          </button>
          <button
            onClick={onRight}
            disabled={!canNavigateRight}
            className={cn(
              "p-3 rounded-lg transition-colors",
              canNavigateRight
                ? "bg-black/60 hover:bg-black/80"
                : "bg-black/30 opacity-50 cursor-not-allowed"
            )}
            aria-label="Next section"
          >
            <ArrowRight
              className={cn(
                "h-6 w-6",
                canNavigateRight ? "text-orange-400" : "text-gray-500"
              )}
            />
          </button>
        </div>
      )}
    </div>
  );
}
