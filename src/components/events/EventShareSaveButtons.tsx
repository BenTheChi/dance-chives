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

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggle();
  };

  if (variant === "small") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          onClick={(e) => handleShareClick(e)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="border border-black w-6 h-6 rounded-full bg-accent-purple flex items-center justify-center transition-all shadow-hover hover:bg-accent-purple/80 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-black"
          aria-label="Share event"
          title={shareCopied ? "Copied!" : "Copy event URL"}
        >
          <Share2 className="h-3 w-3 text-white mb-[1px] mr-[1px]" />
        </button>
        <button
          onClick={(e) => handleSaveClick(e)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={isPending}
          className={cn(
            "border border-black w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-hover focus-visible:outline-none focus-visible:ring-0 focus-visible:border-black",
            isSaved
              ? "bg-red-500 hover:bg-red-300"
              : "bg-accent-purple hover:bg-accent-purple/80",
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

  // Large variant (default) - shows icons only on small screens
  return (
    <div className={cn("flex justify-center gap-4", className)}>
      <Button
        onClick={(e) => handleShareClick(e)}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        variant="default"
        className="bg-accent-purple text-black border-black focus-visible:outline-none focus-visible:ring-0 focus-visible:border-black"
        aria-label="Share event"
        title={shareCopied ? "Copied!" : "Copy event URL"}
      >
        <Share2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">
          {shareCopied ? "Copied!" : "Share"}
        </span>
      </Button>
      <Button
        onClick={(e) => handleSaveClick(e)}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={isPending}
        variant="default"
        className={cn(
          "border-black focus-visible:outline-none focus-visible:ring-0 focus-visible:border-black",
          isSaved
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-accent-purple text-black"
        )}
        aria-label={isSaved ? "Unsave event" : "Save event"}
      >
        <Heart
          className={cn(
            "h-4 w-4 sm:mr-2",
            isSaved ? "fill-white text-white" : "text-black"
          )}
        />
        <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
      </Button>
    </div>
  );
}
