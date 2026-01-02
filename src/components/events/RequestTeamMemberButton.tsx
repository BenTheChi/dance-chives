"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createTeamMemberRequest,
  hasPendingTeamMemberRequest,
} from "@/lib/server_actions/request_actions";
import { toast } from "sonner";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";

interface RequestTeamMemberButtonProps {
  eventId: string;
  creatorId?: string | null;
  isTeamMember?: boolean;
}

export function RequestTeamMemberButton({
  eventId,
  creatorId,
  isTeamMember = false,
}: RequestTeamMemberButtonProps) {
  const { data: session } = useSession();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);

  const userAuth = session?.user?.auth ?? 0;
  const isAccountVerified = !!session?.user?.accountVerified;

  // Check for pending team member request
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!session?.user?.id || !isAccountVerified) {
        setIsCheckingRequest(false);
        return;
      }

      try {
        const pending = await hasPendingTeamMemberRequest(eventId);
        setHasPendingRequest(pending);
      } catch (error) {
        // If there's an error (e.g., user not authenticated), assume no pending request
        setHasPendingRequest(false);
      } finally {
        setIsCheckingRequest(false);
      }
    };

    checkPendingRequest();
  }, [eventId, session?.user?.id, isAccountVerified]);

  // Don't show button if user is not logged in, not verified, is the creator, is already a team member, or doesn't have required auth level
  if (
    !session?.user?.id ||
    !isAccountVerified ||
    session.user.id === creatorId ||
    isTeamMember ||
    userAuth < AUTH_LEVELS.CREATOR
  ) {
    return null;
  }

  // Show loading state while checking
  if (isCheckingRequest) {
    return null;
  }

  // Show message if there's a pending request
  if (hasPendingRequest) {
    return (
      <span className="text-sm text-muted-foreground">
        Team member requested
      </span>
    );
  }

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      await createTeamMemberRequest(eventId);
      toast.success("Team member request sent");
      setShowDialog(false);
      setHasPendingRequest(true); // Update state after successful request
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send request";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="text-sm"
      >
        Team Member Request
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Team Membership</DialogTitle>
            <DialogDescription>
              Team membership allows you to help manage event details and
              content on Dance Chives. If you are not an authorized
              representative, please do not request team membership.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRequest} disabled={isLoading}>
              {isLoading ? "Sending..." : "Request Team Membership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
