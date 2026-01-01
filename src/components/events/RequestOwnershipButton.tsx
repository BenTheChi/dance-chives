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
  createOwnershipRequest,
  hasPendingOwnershipRequest,
} from "@/lib/server_actions/request_actions";
import { toast } from "sonner";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";

interface RequestOwnershipButtonProps {
  eventId: string;
  creatorId?: string | null;
}

export function RequestOwnershipButton({
  eventId,
  creatorId,
}: RequestOwnershipButtonProps) {
  const { data: session } = useSession();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);

  // Only show button if user is logged in, registered (account verified), not the current owner, and has auth level 0 (regular user)
  const userAuth = session?.user?.auth ?? 0;
  console.log(session);
  const isAccountVerified = !!session?.user?.accountVerified;

  // Check for pending ownership request
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!session?.user?.id || !isAccountVerified) {
        setIsCheckingRequest(false);
        return;
      }

      try {
        const pending = await hasPendingOwnershipRequest(eventId);
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

  if (
    !session?.user?.id ||
    !isAccountVerified ||
    session.user.id === creatorId ||
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
      <span className="text-sm text-muted-foreground">Ownership requested</span>
    );
  }

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      await createOwnershipRequest(eventId);
      toast.success("Ownership request sent");
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
        Request Ownership
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Page Owner</DialogTitle>
            <DialogDescription>
              Page ownership allows you to manage event details and attribution
              on Dance Chives. It does not imply copyright ownership of any
              media. If you are not the event organizer or an authorized
              representative, please do not claim this page.
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
              {isLoading ? "Sending..." : "Request Ownership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
