"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Settings, Share2 } from "lucide-react";
import Link from "next/link";
import { TagUserCircleButton } from "@/components/events/TagUserCircleButton";
import { toast } from "sonner";
import { useToggleSave } from "@/hooks/use-toggle-save";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventClientProps {
  eventId: string;
}

// Save button component that uses the toggle hook
function SaveButton({
  eventId,
  initialSaved,
}: EventClientProps & { initialSaved: boolean }) {
  const { isSaved, toggle, isPending } = useToggleSave(initialSaved, eventId);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggle();
  };

  return (
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
  );
}

// Component for Share and Save buttons
export function EventShareSaveButtonsWrapper({
  eventId,
  initialSaved,
  isAuthenticated,
}: EventClientProps & {
  initialSaved: boolean;
  isAuthenticated: boolean;
}) {
  const [shareCopied, setShareCopied] = useState(false);

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const eventUrl = `${window.location.origin}/events/${eventId}`;
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

  return (
    <div className="flex justify-center gap-4">
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
      {isAuthenticated && (
        <SaveButton
          key={initialSaved ? "saved" : "unsaved"}
          eventId={eventId}
          initialSaved={initialSaved}
        />
      )}
    </div>
  );
}

// Component for TagUserCircleButton in Roles section
export function EventTagSelfButton({
  eventId,
  currentUserRoles,
}: EventClientProps & {
  currentUserRoles: string[];
}) {
  if (currentUserRoles.length === 0) {
    return null;
  }

  return (
    <TagUserCircleButton
      eventId={eventId}
      currentUserRoles={currentUserRoles}
      size="sm"
    />
  );
}

// Component for Edit and Settings buttons
export function EventEditButtons({
  eventId,
  canEdit,
  isCreator,
  isModeratorOrAdmin,
}: EventClientProps & {
  canEdit: boolean;
  isCreator: boolean;
  isModeratorOrAdmin: boolean;
}) {
  if (!canEdit && !isCreator) {
    return null;
  }

  return (
    <div className="flex gap-2 mb-2 mt-4 sm:mt-2 w-full justify-center">
      {(isCreator || isModeratorOrAdmin) && (
        <Button
          asChild
          size="xl"
          variant="destructive"
          className="!font-bold text-[18px]"
        >
          <Link href={`/events/${eventId}/settings`}>Settings</Link>
        </Button>
      )}
      {(canEdit || isCreator) && (
        <Button asChild size="xl" className="!font-bold text-[18px]">
          <Link href={`/events/${eventId}/edit`}>Edit</Link>
        </Button>
      )}
    </div>
  );
}
