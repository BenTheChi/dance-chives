"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleSave } from "@/hooks/use-toggle-save";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EventShareSaveButtonsProps {
  eventId: string;
  initialSaved: boolean;
  variant?: "small" | "large";
  eventHref?: string; // Optional href for share URL (defaults to /events/${eventId})
  onSaveStateChange?: (saved: boolean) => void; // Optional callback for save state changes
  className?: string; // Optional className for container
}

export function EventShareSaveButtons({
  eventId,
  initialSaved,
  variant = "large",
  eventHref,
  onSaveStateChange,
  className,
}: EventShareSaveButtonsProps) {
  const { isSaved, toggle, isPending } = useToggleSave(initialSaved, eventId);
  const [shareCopied, setShareCopied] = useState(false);
  const prevSavedStateRef = useRef(isSaved);

  // Show toast when saved state changes (but not on initial mount)
  useEffect(() => {
    if (
      prevSavedStateRef.current !== isSaved &&
      prevSavedStateRef.current !== undefined
    ) {
      if (isSaved) {
        toast.success("Event saved");
      } else {
        toast.success("Event unsaved");
      }
      onSaveStateChange?.(isSaved);
    }
    prevSavedStateRef.current = isSaved;
  }, [isSaved, onSaveStateChange]);

  const handleShareClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const titleHref = eventHref || `/events/${eventId}`;
    const eventUrl = `${window.location.origin}${titleHref}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      setShareCopied(true);
      toast.success("Event URL copied to clipboard!");
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy URL");
    }
  };

  const handleSaveClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await toggle();
  };

  if (variant === "small") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          onClick={handleShareClick}
          className="border border-black w-6 h-6 rounded-full bg-periwinkle flex items-center justify-center transition-all shadow-hover hover:bg-periwinkle-light"
          aria-label="Share event"
          title={shareCopied ? "Copied!" : "Copy event URL"}
        >
          <Share2 className="h-3 w-3 text-white mb-[1px] mr-[1px]" />
        </button>
        <button
          onClick={handleSaveClick}
          disabled={isPending}
          className={cn(
            "border border-black w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-hover",
            isSaved
              ? "bg-red-500 hover:bg-red-300"
              : "bg-periwinkle hover:bg-periwinkle-light",
            isPending && "opacity-50 cursor-not-allowed"
          )}
          aria-label={isSaved ? "Unsave event" : "Save event"}
        >
          <Heart
            className={cn(
              "h-3 w-3",
              isSaved ? "fill-white text-white" : "text-white"
            )}
          />
        </button>
      </div>
    );
  }

  // Large variant (default)
  return (
    <div className={cn("flex justify-center gap-4", className)}>
      <Button
        onClick={handleShareClick}
        variant="default"
        className="bg-periwinkle text-black border-black"
        aria-label="Share event"
        title={shareCopied ? "Copied!" : "Copy event URL"}
      >
        <Share2 className="h-4 w-4 mr-2" />
        {shareCopied ? "Copied!" : "Share"}
      </Button>
      <Button
        onClick={handleSaveClick}
        disabled={isPending}
        variant="default"
        className={cn(
          "border-black",
          isSaved
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-periwinkle text-black"
        )}
        aria-label={isSaved ? "Unsave event" : "Save event"}
      >
        <Heart
          className={cn(
            "h-4 w-4 mr-2",
            isSaved ? "fill-white text-white" : "text-black"
          )}
        />
        {isSaved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
