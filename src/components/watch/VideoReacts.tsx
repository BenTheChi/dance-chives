"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  fire: number[];
  clap: number[];
  wow: number[];
  laugh: number[];
}

interface VideoReactsProps {
  videoId: string;
  currentTime: number;
  onReact: (type: string, timestamp: number) => void;
  userReacts: UserReacts | null;
  onReset: () => void;
  showReacts: boolean;
  onToggleReacts: () => void;
  /** Max reactions per emoji (e.g. 2 for short videos, 3 for longer). Default 3. */
  maxReactsPerEmoji?: number;
  /** Max total reactions across all emojis (e.g. 2 for anon). When set, anon clicks beyond this show sign-up dialog instead of disabling. */
  maxTotalReacts?: number;
  /** When true, allow reacting without signing in (anonymous). */
  allowAnon?: boolean;
  className?: string;
  isFullscreen?: boolean;
}

const REACT_TYPES = [
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "clap", emoji: "👏", label: "Clap" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "laugh", emoji: "😂", label: "Laugh" },
] as const;

const DEFAULT_MAX_REACTS_PER_EMOJI = 3;

export function VideoReacts({
  videoId,
  currentTime,
  onReact,
  userReacts,
  onReset,
  showReacts,
  onToggleReacts,
  maxReactsPerEmoji = DEFAULT_MAX_REACTS_PER_EMOJI,
  maxTotalReacts,
  allowAnon = false,
  className,
  isFullscreen = false,
}: VideoReactsProps) {
  const { data: session } = useSession();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  const isAuthenticated = !!session?.user?.id;
  const canReactAnon = allowAnon && !isAuthenticated;

  // Check if user has used any react (for showing reset button)
  const hasReacted =
    userReacts &&
    (userReacts.fire.length > 0 ||
      userReacts.clap.length > 0 ||
      userReacts.wow.length > 0 ||
      userReacts.laugh.length > 0);

  const totalReacts = userReacts
    ? userReacts.fire.length +
      userReacts.clap.length +
      userReacts.wow.length +
      userReacts.laugh.length
    : 0;

  // Disable only when this emoji type is at its per-emoji limit (so anon's other emojis stay clickable for sign-up dialog).
  const isReactUsed = (type: string): boolean => {
    if (!userReacts) return false;
    return (
      (userReacts[type as keyof UserReacts]?.length ?? 0) >= maxReactsPerEmoji
    );
  };

  // Anon at total quota or this type at limit → show sign-up dialog instead of reacting.
  const anonAtQuotaOrTypeUsed = (type: string): boolean =>
    canReactAnon &&
    (totalReacts >= (maxTotalReacts ?? 0) ||
      (userReacts?.[type as keyof UserReacts]?.length ?? 0) >=
        maxReactsPerEmoji);

  const handleReact = (type: string) => {
    if (!canReactAnon && !isAuthenticated) {
      setShowSignUpDialog(true);
      return;
    }
    if (anonAtQuotaOrTypeUsed(type)) {
      setShowSignUpDialog(true);
      return;
    }
    if (isReactUsed(type)) return;
    onReact(type, Math.floor(Math.max(0, currentTime - 1)));
  };

  const handleResetClick = () => {
    setShowResetDialog(true);
  };

  const handleResetConfirm = () => {
    onReset();
    setShowResetDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center sm:gap-2 w-full",
          isFullscreen && "gap-10 sm:gap-4",
          className
        )}
      >
        {/* React Buttons */}
        <div
          className={cn(
            "flex items-center justify-center",
            isFullscreen ? "flex-col gap-6" : "landscape:flex-col"
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
                    : "cursor-pointer hover:scale-110"
                )}
                aria-label={`React with ${label}`}
                title={
                  isUsed
                    ? `${label} limit reached`
                    : anonAtQuotaOrTypeUsed(type)
                      ? "Sign up to add more reactions"
                      : !canReactAnon && !isAuthenticated
                        ? `Sign up to react with ${label}`
                        : label
                }
              >
                {emoji}
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            "flex items-center justify-center gap-3",
            isFullscreen ? "gap-6 flex-col" : "landscape:flex-col"
          )}
        >
          {/* Reset Link - Show only for logged-in users who have reacted (anon has no reset) */}
          {isAuthenticated && hasReacted && (
            <button
              onClick={handleResetClick}
              className={cn(
                "text-sm text-white/70 hover:text-white underline transition-colors",
                isFullscreen && "text-base"
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
              isFullscreen && "text-base"
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

      {/* Sign Up Dialog */}
      <Dialog open={showSignUpDialog} onOpenChange={setShowSignUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="!text-center !text-lg sm:!text-2xl">
              👏 Sign up for more reacts 🔥
            </DialogTitle>
            <DialogDescription asChild>
              <ul className="mt-2 list-disc list-inside space-y-1 !text-lg text-muted-foreground text-left">
                <li>12 reacts per video (4x more)</li>
                <li>Personal calendar</li>
                <li>Tag yourself and others in videos</li>
                <li>Create your own events</li>
                <li>Support the dance community!</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSignUpDialog(false)}
            >
              Cancel
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
