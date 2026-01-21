"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserReacts {
  fire: number;
  clap: number;
  wow: number;
  laugh: number;
}

interface VideoReactsProps {
  videoId: string;
  currentTime: number;
  onReact: (type: string, timestamp: number) => void;
  userReacts: UserReacts | null;
  onReset: () => void;
  showReacts: boolean;
  onToggleReacts: () => void;
  className?: string;
  isFullscreen?: boolean;
}

const REACT_TYPES = [
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "clap", emoji: "👏", label: "Clap" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "laugh", emoji: "😂", label: "Laugh" },
] as const;

export function VideoReacts({
  videoId,
  currentTime,
  onReact,
  userReacts,
  onReset,
  showReacts,
  onToggleReacts,
  className,
  isFullscreen = false,
}: VideoReactsProps) {
  const { data: session } = useSession();
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Check if user has used any react (for showing reset button)
  const hasReacted =
    userReacts &&
    (userReacts.fire > 0 ||
      userReacts.clap > 0 ||
      userReacts.wow > 0 ||
      userReacts.laugh > 0);

  // Check if a specific react type has been used
  const isReactUsed = (type: string): boolean => {
    if (!userReacts) return false;
    return userReacts[type as keyof UserReacts] > 0;
  };

  const handleReact = (type: string) => {
    if (isReactUsed(type) || !session?.user?.id) return;
    onReact(type, Math.max(0, currentTime - 1));
  };

  const handleResetClick = () => {
    setShowResetDialog(true);
  };

  const handleResetConfirm = () => {
    onReset();
    setShowResetDialog(false);
  };

  // Don't render if user is not authenticated
  if (!session?.user?.id) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center gap-2 sm:gap-2 w-full",
          isFullscreen && "gap-10 sm:gap-4",
          className,
        )}
      >
        {/* React Buttons */}
        <div
          className={cn(
            "flex items-center justify-center",
            isFullscreen ? "flex-col gap-6" : "landscape:flex-col",
          )}
        >
          {REACT_TYPES.map(({ type, emoji, label }) => {
            const isUsed = isReactUsed(type);
            return (
              <button
                key={type}
                onClick={() => handleReact(type)}
                disabled={isUsed}
                className={cn(
                  "text-3xl p-3 rounded-lg transition-all",
                  isFullscreen && "text-6xl px-4",
                  "hover:bg-white/10 active:scale-95",
                  isUsed
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:scale-110",
                )}
                aria-label={`React with ${label}`}
                title={isUsed ? `${label} already used` : label}
              >
                {emoji}
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            "flex items-center justify-center gap-3",
            isFullscreen ? "gap-6 flex-col" : "landscape:flex-col",
          )}
        >
          {/* Reset Link */}
          {hasReacted && (
            <button
              onClick={handleResetClick}
              className={cn(
                "text-sm text-white/70 hover:text-white underline transition-colors",
                isFullscreen && "text-base",
              )}
            >
              Reset
            </button>
          )}

          {/* Toggle Reacts Link */}
          <button
            onClick={onToggleReacts}
            className={cn(
              "text-sm text-white/70 hover:text-white underline transition-colors font-semibold uppercase",
              isFullscreen && "text-base",
            )}
          >
            {showReacts ? "OFF" : "ON"}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Reacts</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all your reacts for this video?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetConfirm}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
