"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSavedEventIds } from "@/lib/server_actions/event_actions";
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
        const savedResult = await getSavedEventIds();
        if (savedResult.status === 200 && "eventIds" in savedResult) {
          setSavedEventIds(new Set(savedResult.eventIds));
        }
      } catch (error) {
        console.error("Failed to fetch saved events:", error);
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

