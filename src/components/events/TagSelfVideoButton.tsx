"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  tagSelfInVideo,
  removeTagFromVideo,
  getPendingTagRequest,
} from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

interface TagSelfVideoButtonProps {
  eventId: string;
  videoId: string;
  currentUserId: string | undefined;
  isUserTagged: boolean;
}

export function TagSelfVideoButton({
  eventId,
  videoId,
  currentUserId,
  isUserTagged,
}: TagSelfVideoButtonProps) {
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
    if (currentUserId && !isUserTagged) {
      getPendingTagRequest(eventId, videoId, currentUserId)
        .then((request) => {
          setPendingRequest(request);
        })
        .catch((error) => {
          console.error("Error fetching pending request:", error);
        });
    } else {
      setPendingRequest(null);
    }
  }, [eventId, videoId, currentUserId, isUserTagged]);

  const handleTagSelf = () => {
    if (!currentUserId) return;

    startTransition(async () => {
      try {
        const result = await tagSelfInVideo(eventId, videoId);
        if (result.directTag) {
          toast.success("Successfully tagged yourself in this video");
          setPendingRequest(null);
          router.refresh(); // Refresh the page to show the updated tag
        } else {
          toast.success(
            "Request to tag yourself in this video has been created"
          );
          setPendingRequest(null);
          // Refresh to get pending request status
          const request = await getPendingTagRequest(
            eventId,
            videoId,
            currentUserId
          );
          setPendingRequest(request);
        }
      } catch (error) {
        console.error("Error tagging self:", error);
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
        await removeTagFromVideo(eventId, videoId, currentUserId);
        toast.success("Successfully removed tag from this video");
        router.refresh(); // Refresh the page to show the updated tag
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
          Request Pending
        </Badge>
      </div>
    );
  }

  // Show tag/untag button
  return (
    <div className="flex flex-col gap-2">
      {isUserTagged ? (
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
      ) : (
        <Button
          onClick={handleTagSelf}
          disabled={isPending}
          variant="default"
          size="sm"
          className="w-fit"
        >
          {isPending ? "Processing..." : "Tag Self"}
        </Button>
      )}
    </div>
  );
}
