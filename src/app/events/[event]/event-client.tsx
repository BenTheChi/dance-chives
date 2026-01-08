"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Settings, Share2 } from "lucide-react";
import Link from "next/link";
import { TagUserCircleButton } from "@/components/events/TagUserCircleButton";
import { getEventAuthData } from "@/lib/server_actions/event_actions";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useToggleSave } from "@/hooks/use-toggle-save";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventAuthData {
  isSaved: boolean;
  isCreator: boolean;
  isTeamMember: boolean;
  canEdit: boolean;
  canTagDirectly: boolean;
  currentUserRoles: string[];
  isModeratorOrAdmin: boolean;
}

interface EventClientProps {
  eventId: string;
}

// Hook to fetch and manage event auth data
function useEventAuthData(eventId: string) {
  const { status } = useSession();
  const [authData, setAuthData] = useState<EventAuthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    const fetchAuthData = async () => {
      try {
        const result = await getEventAuthData(eventId);
        if (result.status === 200 && result.data) {
          setAuthData(result.data);
        } else {
          setAuthData({
            isSaved: false,
            isCreator: false,
            isTeamMember: false,
            canEdit: false,
            canTagDirectly: false,
            currentUserRoles: [],
            isModeratorOrAdmin: false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch event auth data:", error);
        setAuthData({
          isSaved: false,
          isCreator: false,
          isTeamMember: false,
          canEdit: false,
          canTagDirectly: false,
          currentUserRoles: [],
          isModeratorOrAdmin: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAuthData();
  }, [eventId, status]);

  return { authData, loading, status };
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
export function EventShareSaveButtonsWrapper({ eventId }: EventClientProps) {
  const { authData, loading, status } = useEventAuthData(eventId);
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
      {loading && status === "authenticated" ? (
        <Skeleton className="h-10 w-24 rounded-full" aria-hidden="true" />
      ) : status === "authenticated" && authData ? (
        <SaveButton
          key={authData.isSaved ? "saved" : "unsaved"}
          eventId={eventId}
          initialSaved={authData.isSaved}
        />
      ) : null}
    </div>
  );
}

// Component for TagUserCircleButton in Roles section
export function EventTagSelfButton({ eventId }: EventClientProps) {
  const { authData, loading, status } = useEventAuthData(eventId);

  if (loading && status === "authenticated") {
    return <Skeleton className="h-8 w-8 rounded-full" aria-hidden="true" />;
  }

  if (!authData) {
    return null;
  }

  return (
    <TagUserCircleButton
      eventId={eventId}
      currentUserRoles={authData.currentUserRoles}
      size="sm"
    />
  );
}

// Component for Edit and Settings buttons
export function EventEditButtons({ eventId }: EventClientProps) {
  const { authData, loading } = useEventAuthData(eventId);

  if (loading || !authData) {
    return null;
  }

  if (!authData.canEdit && !authData.isCreator) {
    return null;
  }

  return (
    <div className="flex gap-2 mb-2 mt-4 sm:mt-2 w-full justify-center">
      {(authData.isCreator || authData.isModeratorOrAdmin) && (
        <Button
          asChild
          size="xl"
          variant="destructive"
          className="!font-bold text-[18px]"
        >
          <Link href={`/events/${eventId}/settings`}>Settings</Link>
        </Button>
      )}
      {(authData.canEdit || authData.isCreator) && (
        <Button asChild size="xl" className="!font-bold text-[18px]">
          <Link href={`/events/${eventId}/edit`}>Edit</Link>
        </Button>
      )}
    </div>
  );
}
