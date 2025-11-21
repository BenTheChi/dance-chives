"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  tagSelfInVideo,
  tagSelfInSection,
  removeTagFromVideo,
  removeTagFromSection,
  getPendingTagRequest,
} from "@/lib/server_actions/request_actions";
import {
  VIDEO_ROLE_DANCER,
  VIDEO_ROLE_WINNER,
  SECTION_ROLE_WINNER,
} from "@/lib/utils/roles";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trophy, X } from "lucide-react";

type TagTarget = "video" | "section";
type TagRole =
  | typeof VIDEO_ROLE_DANCER
  | typeof VIDEO_ROLE_WINNER
  | typeof SECTION_ROLE_WINNER;

// Helper function to check if role is a winner role
// Both VIDEO_ROLE_WINNER and SECTION_ROLE_WINNER have the value "Winner"
function isWinnerRole(
  role: TagRole
): role is typeof VIDEO_ROLE_WINNER | typeof SECTION_ROLE_WINNER {
  return (role as string) === "Winner";
}

interface TagSelfButtonProps {
  eventId: string;
  target: TagTarget;
  targetId: string; // videoId or sectionId
  currentUserId: string | undefined;
  role: TagRole;
  isUserTagged: boolean;
  showRemoveButton?: boolean;
  buttonLabel?: string;
  pendingLabel?: string;
  successLabel?: string;
}

export function TagSelfButton({
  eventId,
  target,
  targetId,
  currentUserId,
  role,
  isUserTagged,
  showRemoveButton = false,
  buttonLabel,
  pendingLabel,
  successLabel,
}: TagSelfButtonProps) {
  const [pendingRequest, setPendingRequest] = useState<{
    id: string;
    status: string;
    createdAt: Date;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Don't show the button if user is not logged in
  if (!currentUserId) {
    return null;
  }

  // Check for pending requests on mount and when user tags/untags
  useEffect(() => {
    if (!currentUserId) {
      setPendingRequest(null);
      return;
    }

    // If user is already tagged, they shouldn't have a pending request
    if (isUserTagged) {
      setPendingRequest(null);
      return;
    }

    // Check for pending request
    const videoId = target === "video" ? targetId : undefined;
    const sectionId = target === "section" ? targetId : undefined;

    getPendingTagRequest(eventId, videoId, currentUserId, sectionId, role)
      .then((request) => {
        setPendingRequest(request);
      })
      .catch((error) => {
        console.error("Error fetching pending request:", error);
        setPendingRequest(null);
      });
  }, [eventId, target, targetId, currentUserId, isUserTagged, role]);

  const handleTagSelf = () => {
    if (!currentUserId) return;

    startTransition(async () => {
      try {
        if (target === "video") {
          const result = await tagSelfInVideo(eventId, targetId, role);

          // Check if all requests already existed (only for video tags)
          if (result.existingRequests && result.existingRequests.length > 0) {
            const requestCount = result.existingRequests.length;
            if (requestCount === 1) {
              toast.info(
                `A pending tagging request for ${result.existingRequests[0]} already exists`
              );
            } else {
              toast.info(
                `Pending tagging requests for ${result.existingRequests.join(
                  " and "
                )} already exist`
              );
            }
            // Refresh to get pending request status
            try {
              const request = await getPendingTagRequest(
                eventId,
                targetId,
                currentUserId,
                undefined,
                role
              );
              setPendingRequest(request);
            } catch (fetchError) {
              console.error("Error fetching pending request:", fetchError);
            }
            return;
          }

          if (result.directTag) {
            const defaultMessage =
              role === VIDEO_ROLE_WINNER
                ? "Successfully tagged yourself as winner"
                : "Successfully tagged yourself";
            toast.success(successLabel || defaultMessage);
            setPendingRequest(null);
            router.refresh();
          } else {
            toast.success(
              successLabel
                ? `Request to ${successLabel.toLowerCase()} has been created`
                : "Request to tag yourself has been created"
            );
            setPendingRequest(null);
            try {
              const request = await getPendingTagRequest(
                eventId,
                targetId,
                currentUserId,
                undefined,
                role
              );
              setPendingRequest(request);
            } catch (fetchError) {
              console.error("Error fetching pending request:", fetchError);
            }
          }
        } else {
          const result = await tagSelfInSection(eventId, targetId, role);

          if (result.directTag) {
            toast.success(
              successLabel || "Successfully tagged yourself as winner"
            );
            setPendingRequest(null);
            router.refresh();
          } else {
            toast.success(
              successLabel
                ? `Request to ${successLabel.toLowerCase()} has been created`
                : "Request to tag yourself has been created"
            );
            setPendingRequest(null);
            try {
              const request = await getPendingTagRequest(
                eventId,
                undefined,
                currentUserId,
                targetId,
                role
              );
              setPendingRequest(request);
            } catch (fetchError) {
              console.error("Error fetching pending request:", fetchError);
            }
          }
        }
      } catch (error) {
        console.error("Error tagging self:", error);
        // If error is about existing request, check for pending request
        if (
          error instanceof Error &&
          error.message.includes("already exists")
        ) {
          try {
            const videoId = target === "video" ? targetId : undefined;
            const sectionId = target === "section" ? targetId : undefined;
            const request = await getPendingTagRequest(
              eventId,
              videoId,
              currentUserId,
              sectionId,
              role
            );
            if (request) {
              setPendingRequest(request);
              toast.info("A pending tagging request already exists");
              return;
            }
          } catch (fetchError) {
            console.error("Error fetching pending request:", fetchError);
          }
        }
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to tag yourself. Please try again."
        );
      }
    });
  };

  const handleRemoveTag = () => {
    if (!currentUserId) return;

    startTransition(async () => {
      try {
        if (target === "video") {
          await removeTagFromVideo(eventId, targetId, currentUserId);
        } else {
          await removeTagFromSection(eventId, targetId, currentUserId);
        }
        toast.success("Successfully removed tag");
        router.refresh();
      } catch (error) {
        console.error("Error removing tag:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove tag. Please try again."
        );
      }
    });
  };

  // Show pending request status
  if (pendingRequest && !isUserTagged) {
    return (
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit">
          {pendingLabel || `${role} tag request pending`}
        </Badge>
      </div>
    );
  }

  // Show tag/untag button
  const defaultLabel = isWinnerRole(role) ? "Tag Self as Winner" : "Tag Self";

  // If user is tagged and showRemoveButton is true, show remove button
  // Otherwise, if user is tagged and it's a winner role, hide the button (no remove option)
  // Otherwise, show the tag button
  if (isUserTagged && showRemoveButton) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleRemoveTag}
          disabled={isPending}
          variant="outline"
          size="sm"
          className="w-fit"
        >
          <X className="h-4 w-4 mr-2" />
          Remove Tag
        </Button>
      </div>
    );
  }

  // Hide button if user is already tagged and this is a winner-only button without remove option
  if (isUserTagged && isWinnerRole(role) && !showRemoveButton) {
    return null;
  }

  // Get button color based on role
  const getRoleColorClass = () => {
    const roleStr = role as string;
    if (isWinnerRole(role)) {
      return "bg-yellow-500 hover:bg-yellow-600";
    }
    if (roleStr === "Dancer") {
      return "bg-green-300 hover:bg-green-400 text-gray-900";
    }
    if (roleStr === "Teacher") {
      return "bg-purple-300 hover:bg-purple-400 text-gray-900";
    }
    if (roleStr === "Choreographer") {
      return "bg-blue-300 hover:bg-blue-400 text-gray-900";
    }
    return "";
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleTagSelf}
        disabled={isPending}
        variant="default"
        size="sm"
        className={`w-fit ${getRoleColorClass()}`}
      >
        {isWinnerRole(role) && <Trophy className="h-4 w-4 mr-2" />}
        {isPending ? "Processing..." : buttonLabel || defaultLabel}
      </Button>
    </div>
  );
}
