"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AVAILABLE_ROLES } from "@/lib/utils/roles";
import {
  tagSelfWithRole,
  getPendingTagRequest,
} from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface TagSelfButtonProps {
  eventId: string;
  currentUserRoles: string[]; // Roles already assigned to the current user
  isTeamMember?: boolean; // Whether the user is already a team member
  canTagDirectly: boolean; // Whether the user can tag directly or needs to make a request
}

export function TagSelfButton({
  eventId,
  currentUserRoles,
  isTeamMember = false,
  canTagDirectly,
}: TagSelfButtonProps) {
  const { data: session } = useSession();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [pendingRoles, setPendingRoles] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  // Filter out roles already assigned to the current user
  // Also filter out "Team Member" if user is already a team member
  const availableRoles = useMemo(
    () =>
      AVAILABLE_ROLES.filter(
        (role) =>
          !currentUserRoles.includes(role) &&
          !(role === "Team Member" && isTeamMember)
      ),
    [currentUserRoles, isTeamMember]
  );

  // Check for pending requests for all available roles in a single GET request
  useEffect(() => {
    if (!session?.user?.id || availableRoles.length === 0) {
      return;
    }

    const checkPendingRequests = async () => {
      try {
        // Fetch all pending requests for all available roles in a single GET request
        const rolesParam = availableRoles.join(",");
        const response = await fetch(
          `/api/tagging-requests/pending?eventId=${encodeURIComponent(eventId)}&roles=${encodeURIComponent(rolesParam)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pending requests");
        }

        const { data } = await response.json();
        // Convert object to Set of roles that have pending requests
        const pendingSet = new Set<string>(Object.keys(data || {}));
        setPendingRoles(pendingSet);
      } catch (error) {
        console.error("Error checking pending requests:", error);
      }
    };

    checkPendingRequests();
  }, [eventId, session?.user?.id, availableRoles]);

  // Don't show the button if user is not logged in or all roles are taken
  if (!session?.user?.id || availableRoles.length === 0) {
    return null;
  }

  // Filter out roles with pending requests
  const selectableRoles = availableRoles.filter(
    (role) => !pendingRoles.has(role)
  );

  const handleConfirm = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    startTransition(async () => {
      try {
        const result = await tagSelfWithRole(eventId, selectedRole);

        if (result.directTag) {
          toast.success(`Successfully tagged yourself as ${selectedRole}`);
          setSelectedRole(""); // Reset selection
          setIsDialogOpen(false); // Close dialog
          router.refresh(); // Refresh the page to show the updated roles
        } else {
          toast.success(`Request to tag yourself as ${selectedRole} has been created`);
          setSelectedRole(""); // Reset selection
          setIsDialogOpen(false); // Close dialog
          // Refresh to get pending request status
          try {
            const request = await getPendingTagRequest(
              eventId,
              undefined,
              session?.user?.id,
              undefined,
              selectedRole
            );
            if (request) {
              setPendingRoles((prev) => new Set(prev).add(selectedRole));
            }
          } catch (fetchError) {
            console.error("Error fetching pending request:", fetchError);
            // Don't show error for this - it's not critical
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
            const request = await getPendingTagRequest(
              eventId,
              undefined,
              session?.user?.id,
              undefined,
              selectedRole
            );
            if (request) {
              setPendingRoles((prev) => new Set(prev).add(selectedRole));
              toast.info(`${selectedRole} tag request pending`);
              setIsDialogOpen(false);
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

  return (
    <div className="flex flex-col gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="w-fit"
      >
        Tag Myself
      </Button>
      {pendingRoles.size > 0 && (
        <div className="flex flex-col gap-2">
          {Array.from(pendingRoles).map((role) => (
            <Badge key={role} variant="outline" className="w-fit">
              {role} tag request pending
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag Yourself</DialogTitle>
            <DialogDescription>
              Select a role to tag yourself with for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {selectableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedRole("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isPending || !selectedRole}
            >
              {canTagDirectly ? "Confirm" : "Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
