"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";

interface RolePendingBadgeProps {
  eventId: string;
  roleTitle: string; // Neo4j role format (e.g., "ORGANIZER", "DJ")
}

export function RolePendingBadge({
  eventId,
  roleTitle,
}: RolePendingBadgeProps) {
  const { data: session } = useSession();
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const checkPending = async () => {
      try {
        // Convert Neo4j role format to human-readable format for API
        const humanReadableRole = fromNeo4jRoleFormat(roleTitle) || roleTitle;
        const response = await fetch(
          `/api/tagging-requests/pending?eventId=${encodeURIComponent(
            eventId
          )}&roles=${encodeURIComponent(humanReadableRole)}`
        );

        if (!response.ok) {
          return;
        }

        const { data } = await response.json();
        // Check if there's a pending request for this role
        setHasPending(!!data[humanReadableRole]);
      } catch (error) {
        console.error("Error checking pending request:", error);
      }
    };

    checkPending();
  }, [eventId, roleTitle, session?.user?.id]);

  if (!hasPending) {
    return null;
  }

  // Convert role title to human-readable format for display
  const displayRole = fromNeo4jRoleFormat(roleTitle) || roleTitle;

  return (
    <Badge
      variant="outline"
      className="bg-gray-200 text-black hover:bg-gray-300 text-xs"
    >
      {displayRole} tag request pending
    </Badge>
  );
}

