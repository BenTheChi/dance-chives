"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RequestTeamMemberButton } from "./RequestTeamMemberButton";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  image?: string | null;
  city?: string;
  styles?: string[];
}

interface TeamMembersDisplayProps {
  teamMembers: TeamMember[];
  eventId: string;
  creatorId?: string | null;
  currentUserId?: string | null;
  isCurrentUserTeamMember: boolean;
}

export function TeamMembersDisplay({
  teamMembers,
  eventId,
  creatorId,
  currentUserId,
  isCurrentUserTeamMember,
}: TeamMembersDisplayProps) {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Only show if there are team members (per requirement: "If there are any team members")
  if (teamMembers.length === 0) {
    return null;
  }

  const handleRemoveTeamMember = async (userId: string) => {
    if (!currentUserId || currentUserId !== userId) {
      return; // Only allow removing yourself
    }

    setRemovingMemberId(userId);
    try {
      const response = await fetch("/api/event/team-members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove team member");
      }

      toast.success("Removed from team members");
      // Reload the page to reflect the change
      window.location.reload();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove team member";
      toast.error(errorMessage);
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="flex flex-row gap-2 items-center">
      <div className="flex flex-row gap-2 items-center flex-wrap">
        {teamMembers.map((member) => (
          <UserAvatar
            key={member.id}
            username={member.username || ""}
            displayName={member.displayName || member.username || ""}
            avatar={member.avatar}
            image={member.image}
            isSmall={true}
            showHoverCard
            city={member.city || ""}
            styles={member.styles}
            showRemoveButton={
              currentUserId === member.id && isCurrentUserTeamMember
            }
            onRemove={() => handleRemoveTeamMember(member.id)}
            isRemoving={removingMemberId === member.id}
          />
        ))}
      </div>
    </div>
  );
}
