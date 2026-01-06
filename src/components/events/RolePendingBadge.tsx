"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";

type PendingTarget = "section" | "video";

interface RolePendingBadgeProps {
  eventId: string;
  roleTitle: string; // Neo4j or human-readable role format (e.g., "ORGANIZER", "DJ", "Organizer")
  target?: PendingTarget;
  targetId?: string;
  className?: string;
  /**
   * When true/false, bypasses the fetch call and uses this value instead.
   * Helpful when parent has already resolved pending status.
   */
  hasPendingOverride?: boolean;
}

export function RolePendingBadge({
  eventId,
  roleTitle,
  target,
  targetId,
  className,
  hasPendingOverride,
}: RolePendingBadgeProps) {
  const { data: session } = useSession();
  const [hasPending, setHasPending] = useState<boolean>(!!hasPendingOverride);

  useEffect(() => {
    // If parent knows the pending state, rely on that and skip fetch.
    if (hasPendingOverride !== undefined) {
      setHasPending(!!hasPendingOverride);
      return;
    }

    if (!session?.user?.id) {
      return;
    }

    let cancelled = false;

    const checkPending = async () => {
      try {
        const humanReadableRole = fromNeo4jRoleFormat(roleTitle) || roleTitle;
        const params = new URLSearchParams({ eventId });

        if (target === "section" && targetId) {
          params.append("sectionId", targetId);
        }
        if (target === "video" && targetId) {
          params.append("videoId", targetId);
        }

        params.append("roles", humanReadableRole);

        const response = await fetch(
          `/api/tagging-requests/pending?${params.toString()}`
        );

        if (!response.ok) {
          return;
        }

        const { data } = await response.json();
        if (cancelled) return;
        setHasPending(!!data[humanReadableRole]);
      } catch (error) {
        if (cancelled) return;
        console.error("Error checking pending request:", error);
      }
    };

    checkPending();

    return () => {
      cancelled = true;
    };
  }, [
    eventId,
    roleTitle,
    target,
    targetId,
    session?.user?.id,
    hasPendingOverride,
  ]);

  if (!hasPending) {
    return null;
  }

  const displayRole = fromNeo4jRoleFormat(roleTitle) || roleTitle;
  const badgeClassName =
    className && className.trim().length > 0
      ? `${className} text-xs`
      : "bg-gray-200 text-black hover:bg-gray-300 text-xs";

  return (
    <Badge variant="outline" className={badgeClassName}>
      {displayRole} tag request pending
    </Badge>
  );
}

