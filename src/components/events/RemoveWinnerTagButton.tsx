"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, X } from "lucide-react";
import { removeSelfWinnerTagFromVideo } from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RemoveWinnerTagButtonProps {
  eventId: string;
  videoId: string;
  currentUserId: string;
}

export function RemoveWinnerTagButton({
  eventId,
  videoId,
  currentUserId,
}: RemoveWinnerTagButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleRemoveWinnerTag = async () => {
    if (!currentUserId) return;

    setIsPending(true);
    try {
      await removeSelfWinnerTagFromVideo(eventId, videoId);
      toast.success("Winner tag removed successfully");
      router.refresh();
    } catch (error) {
      console.error("Error removing winner tag:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove winner tag"
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      onClick={handleRemoveWinnerTag}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="w-fit border-yellow-500 text-yellow-600 hover:bg-yellow-50"
    >
      <X className="h-4 w-4 mr-2" />
      {isPending ? "Removing..." : "Remove Winner Tag"}
    </Button>
  );
}
