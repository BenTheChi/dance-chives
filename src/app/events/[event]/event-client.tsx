"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Settings } from "lucide-react";
import Link from "next/link";
import { TagSelfCircleButton } from "@/components/events/TagSelfCircleButton";
import { EventShareSaveButtons } from "@/components/events/EventShareSaveButtons";
import { getEventAuthData } from "@/lib/server_actions/event_actions";

interface EventAuthData {
  isSaved: boolean;
  isCreator: boolean;
  isTeamMember: boolean;
  canEdit: boolean;
  canTagDirectly: boolean;
  currentUserRoles: string[];
}

interface EventClientProps {
  eventId: string;
}

// Hook to fetch and manage event auth data
function useEventAuthData(eventId: string) {
  const { data: session, status } = useSession();
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
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAuthData();
  }, [eventId, status]);

  return { authData, loading };
}

// Component for Share and Save buttons
export function EventShareSaveButtonsWrapper({ eventId }: EventClientProps) {
  const { authData, loading } = useEventAuthData(eventId);

  if (loading) {
    return (
      <div className="mt-10">
        <EventShareSaveButtons eventId={eventId} initialSaved={false} />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <EventShareSaveButtons
        eventId={eventId}
        initialSaved={authData?.isSaved ?? false}
      />
    </div>
  );
}

// Component for TagSelfCircleButton in Roles section
export function EventTagSelfButton({ eventId }: EventClientProps) {
  const { authData, loading } = useEventAuthData(eventId);

  if (loading || !authData) {
    return null;
  }

  return (
    <TagSelfCircleButton
      eventId={eventId}
      currentUserRoles={authData.currentUserRoles}
      isTeamMember={authData.isTeamMember}
      canTagDirectly={authData.canTagDirectly}
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
    <div className="flex gap-2">
      {authData.isCreator && (
        <Button
          asChild
          size="icon"
          className="bg-periwinkle text-black border-black"
        >
          <Link href={`/events/${eventId}/settings`}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      )}
      {(authData.canEdit || authData.isCreator) && (
        <Button
          asChild
          size="icon"
          className="bg-periwinkle text-black border-black"
        >
          <Link href={`/events/${eventId}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

