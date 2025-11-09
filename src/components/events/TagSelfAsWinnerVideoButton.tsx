"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  tagSelfInVideo,
  removeTagFromVideo,
  getPendingTagRequest,
} from "@/lib/server_actions/request_actions";
import { VIDEO_ROLE_WINNER } from "@/lib/utils/roles";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Trophy } from "lucide-react";

interface TagSelfAsWinnerVideoButtonProps {
  eventId: string;
  videoId: string;
  currentUserId: string | undefined;
  isUserWinner: boolean;
}

export function TagSelfAsWinnerVideoButton({
  eventId,
  videoId,
  currentUserId,
  isUserWinner,
}: TagSelfAsWinnerVideoButtonProps) {
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

    // If user is already a winner, they shouldn't have a pending request
    if (isUserWinner) {
      setPendingRequest(null);
      return;
    }

    // Check for pending winner request - include role to differentiate from other roles
    // Note: Role is stored in database as "Winner" (not Neo4j format), so we search for it as-is
    getPendingTagRequest(
      eventId,
      videoId,
      currentUserId,
      undefined,
      VIDEO_ROLE_WINNER
    )
      .then((request) => {
        setPendingRequest(request);
      })
      .catch((error) => {
        console.error("Error fetching pending request:", error);
        setPendingRequest(null);
      });
  }, [eventId, videoId, currentUserId, isUserWinner]);

  const handleTagSelfAsWinner = () => {
    if (!currentUserId) return;

    startTransition(async () => {
      try {
        const result = await tagSelfInVideo(
          eventId,
          videoId,
          VIDEO_ROLE_WINNER
        );

        // Check if all requests already existed
        if (result.existingRequests && result.existingRequests.length > 0) {
          if (result.existingRequests.length === 1) {
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
              videoId,
              currentUserId,
              undefined,
              VIDEO_ROLE_WINNER
            );
            setPendingRequest(request);
          } catch (fetchError) {
            console.error("Error fetching pending request:", fetchError);
            // Don't show error for this - it's not critical
          }
          return;
        }

        if (result.directTag) {
          toast.success("Successfully tagged yourself as winner in this video");
          setPendingRequest(null);
          router.refresh();
        } else {
          toast.success(
            "Request to tag yourself as winner in this video has been created"
          );
          setPendingRequest(null);
          try {
            const request = await getPendingTagRequest(
              eventId,
              videoId,
              currentUserId,
              undefined,
              VIDEO_ROLE_WINNER
            );
            setPendingRequest(request);
          } catch (fetchError) {
            console.error("Error fetching pending request:", fetchError);
            // Don't show error for this - it's not critical
          }
        }
      } catch (error) {
        console.error("Error tagging self as winner:", error);
        // Show error as a notification (toast) - this is graceful and won't crash the app
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to tag yourself as winner. Please try again.";
        toast.error(errorMessage);
        // Don't re-throw - we've handled it gracefully
      }
    });
  };

  const handleRemoveWinnerTag = () => {
    if (!currentUserId) return;

    startTransition(async () => {
      try {
        await removeTagFromVideo(eventId, videoId, currentUserId);
        toast.success("Successfully removed winner tag from this video");
        router.refresh();
      } catch (error) {
        console.error("Error removing winner tag:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove winner tag. Please try again."
        );
      }
    });
  };

  // Hide button if user is already a winner
  if (isUserWinner) {
    return null;
  }

  // Show pending request status
  if (pendingRequest) {
    return (
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit">
          Winner tag request pending
        </Badge>
      </div>
    );
  }

  // Show tag button
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleTagSelfAsWinner}
        disabled={isPending}
        variant="default"
        size="sm"
        className="w-fit bg-yellow-500 hover:bg-yellow-600"
      >
        <Trophy className="h-4 w-4 mr-2" />
        {isPending ? "Processing..." : "Tag Self as Winner"}
      </Button>
    </div>
  );
}
