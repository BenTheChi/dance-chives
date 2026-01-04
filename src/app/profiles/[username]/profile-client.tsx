"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RolesTabsSection } from "@/components/profile/RolesTabsSection";
import { Event } from "@/types/event";

interface ProfileClientProps {
  username: string;
  eventsByRole?: Map<string, Event[]>;
  sortedRoles?: string[];
}

export function ProfileClient({ username }: ProfileClientProps) {
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.username === username;

  if (!isOwnProfile) {
    return null;
  }

  return (
    <Button asChild className="flex-shrink-0">
      <Link href={`/profiles/${username}/edit`}>Edit Profile</Link>
    </Button>
  );
}

interface ProfileRolesSectionProps {
  eventsByRole: Map<string, Event[]>;
  sortedRoles: string[];
}

export function ProfileRolesSection({
  eventsByRole,
  sortedRoles,
}: ProfileRolesSectionProps) {
  const { data: session, status } = useSession();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "loading" || !session?.user?.id) return;

    const fetchSavedEvents = async () => {
      try {
        const response = await fetch("/api/events/saved");
        if (response.ok) {
          const data = await response.json();
          setSavedEventIds(new Set(data?.eventIds ?? []));
        } else if (response.status === 401) {
          setSavedEventIds(new Set());
        } else {
          const errorData = await response.json().catch(() => null);
          console.error(
            "Failed to fetch saved events:",
            errorData?.error || response.statusText
          );
        }
      } catch (error) {
        console.error("Failed to fetch saved events:", error);
        setSavedEventIds(new Set());
      }
    };

    fetchSavedEvents();
  }, [session, status]);

  return (
    <RolesTabsSection
      eventsByRole={eventsByRole}
      sortedRoles={sortedRoles}
      savedEventIds={savedEventIds}
    />
  );
}

