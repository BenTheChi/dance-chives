"use client";

import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
import { DebouncedSearchSelect } from "@/components/ui/debounced-search-select";
import { UserSearchItem } from "@/types/user";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  updateEventTeamMembers,
  updateEventCreator,
  updateEventStatus,
} from "@/lib/server_actions/event_actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface EventSettingsFormProps {
  eventId: string;
  initialTeamMembers: UserSearchItem[];
  initialCreator: UserSearchItem | null;
  initialStatus?: "hidden" | "visible";
}

async function getUserSearchItems(keyword: string): Promise<UserSearchItem[]> {
  return fetch(`${process.env.NEXT_PUBLIC_ORIGIN}/api/users?keyword=${keyword}`)
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to fetch users", response.statusText);
        return [];
      }
      return response.json();
    })
    .then((data) => {
      return data.data;
    })
    .catch((error) => {
      console.error(error);
      return [];
    });
}

async function getUserSearchItemsExcludingCreator(
  keyword: string,
  excludeCreator: UserSearchItem | null
): Promise<UserSearchItem[]> {
  const allUsers = await getUserSearchItems(keyword);
  if (!excludeCreator) {
    return allUsers;
  }
  return allUsers.filter((user) => {
    // Filter by id if both have it, otherwise filter by username
    if (excludeCreator.id && user.id) {
      return user.id !== excludeCreator.id;
    }
    return user.username !== excludeCreator.username;
  });
}

export default function EventSettingsForm({
  eventId,
  initialTeamMembers,
  initialCreator,
  initialStatus = "visible",
}: EventSettingsFormProps) {
  const router = useRouter();
  const [teamMembers, setTeamMembers] =
    useState<UserSearchItem[]>(initialTeamMembers);
  const [selectedCreator, setSelectedCreator] = useState<UserSearchItem | null>(
    initialCreator
  );
  const [status, setStatus] = useState<"hidden" | "visible">(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOwnershipDialog, setShowOwnershipDialog] = useState(false);
  const [showChangeOwnershipDialog, setShowChangeOwnershipDialog] =
    useState(false);
  const [newCreatorInDialog, setNewCreatorInDialog] =
    useState<UserSearchItem | null>(null);
  const [pendingSave, setPendingSave] = useState<{
    addOldCreatorAsTeamMember: boolean;
  } | null>(null);

  const handleTeamMembersChange = (newTeamMembers: UserSearchItem[]) => {
    setTeamMembers(newTeamMembers);
  };

  const performSave = async (
    addOldCreatorAsTeamMember: boolean = false,
    teamMembersToSave: UserSearchItem[] = teamMembers
  ) => {
    setIsSaving(true);
    try {
      // Check if ownership is changing
      const ownershipChanged =
        initialCreator &&
        selectedCreator &&
        initialCreator.id !== selectedCreator.id;

      // Update creator if changed
      if (ownershipChanged && selectedCreator) {
        const creatorResult = await updateEventCreator(
          eventId,
          selectedCreator,
          addOldCreatorAsTeamMember
        );
        if (creatorResult.status !== 200) {
          toast.error(creatorResult.error || "Failed to update creator");
          setIsSaving(false);
          return;
        }
      }

      // Update team members
      const teamResult = await updateEventTeamMembers(
        eventId,
        teamMembersToSave
      );
      if (teamResult.status !== 200) {
        toast.error(teamResult.error || "Failed to update team members");
        setIsSaving(false);
        return;
      }

      // Update status if changed
      if (status !== initialStatus) {
        const statusResult = await updateEventStatus(eventId, status);
        if (statusResult.status !== 200) {
          toast.error(
            "error" in statusResult
              ? statusResult.error || "Failed to update event status"
              : "Failed to update event status"
          );
          setIsSaving(false);
          return;
        }
      }

      if (ownershipChanged) {
        toast.success("Ownership and team members updated successfully");
      } else if (status !== initialStatus) {
        toast.success("Settings updated successfully");
      } else {
        toast.success("Team members updated successfully");
      }
      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
      setPendingSave(null);
    }
  };

  const handleSave = async () => {
    // Check if ownership is changing
    const ownershipChanged =
      initialCreator &&
      selectedCreator &&
      initialCreator.id !== selectedCreator.id;

    if (ownershipChanged && initialCreator) {
      // Check if old creator is a team member
      const oldCreatorIsTeamMember = teamMembers.some(
        (member) => member.id === initialCreator.id
      );

      // If old creator is not a team member, show dialog
      if (!oldCreatorIsTeamMember) {
        setPendingSave({ addOldCreatorAsTeamMember: false });
        setShowOwnershipDialog(true);
        return;
      }
    }

    // No dialog needed, proceed with save
    await performSave();
  };

  const handleOwnershipDialogYes = async () => {
    setShowOwnershipDialog(false);
    if (pendingSave && initialCreator) {
      // Add old creator to team members if not already present
      const oldCreatorIsTeamMember = teamMembers.some(
        (member) => member.id === initialCreator.id
      );
      const updatedTeamMembers = oldCreatorIsTeamMember
        ? teamMembers
        : [...teamMembers, initialCreator];
      // Update state for UI consistency
      setTeamMembers(updatedTeamMembers);
      // Save with updated team members
      await performSave(true, updatedTeamMembers);
    }
  };

  const handleOwnershipDialogNo = async () => {
    setShowOwnershipDialog(false);
    if (pendingSave) {
      await performSave(false);
    }
  };

  const handleOwnershipDialogCancel = () => {
    setShowOwnershipDialog(false);
    setPendingSave(null);
    // Reset creator to initial value
    setSelectedCreator(initialCreator);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/event?id=${eventId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        toast.success("Event deleted");
        router.push("/dashboard");
      } else {
        console.error(response.statusText);
        toast.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const hasTeamMembersChanges =
    JSON.stringify(teamMembers) !== JSON.stringify(initialTeamMembers);
  const hasCreatorChanges =
    JSON.stringify(selectedCreator) !== JSON.stringify(initialCreator);
  const hasStatusChanges = status !== initialStatus;
  const hasChanges =
    hasTeamMembersChanges || hasCreatorChanges || hasStatusChanges;

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full bg-primary rounded-sm p-6">
      <div className="space-y-10">
        <div>
          <h3 className="mb-2">Current Page Owner</h3>
          {initialCreator && (
            <p className="text-sm mb-2">
              {initialCreator.displayName
                ? `${initialCreator.displayName} (${initialCreator.username})`
                : initialCreator.username}
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowChangeOwnershipDialog(true)}
          >
            Change Ownership
          </Button>

          {selectedCreator && selectedCreator.id !== initialCreator?.id && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">New Creator:</p>
              <p className="text-sm text-muted-foreground">
                {selectedCreator.displayName
                  ? `${selectedCreator.displayName} (${selectedCreator.username})`
                  : selectedCreator.username}
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2">Event Status</h3>

          <div className="space-y-2">
            <Select
              value={status}
              onValueChange={(value: "hidden" | "visible") => setStatus(value)}
            >
              <SelectTrigger id="status" className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <h3 className="mb-2">Team Members</h3>

          <DebouncedSearchMultiSelect<UserSearchItem>
            onSearch={getUserSearchItems}
            placeholder="Search for users..."
            onChange={handleTeamMembersChange}
            value={teamMembers}
            name="teamMembers"
            getDisplayValue={(item) =>
              item.displayName
                ? `${item.displayName} (${item.username})`
                : item.username
            }
            getItemId={(item) => item.id || item.username}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTeamMembers(initialTeamMembers);
                setSelectedCreator(initialCreator);
                setStatus(initialStatus);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
        </div>

        {eventId && (
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Event
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              event and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOwnershipDialog} onOpenChange={setShowOwnershipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Ownership</DialogTitle>
            <DialogDescription>
              You are about to lose your access to this event. Would you like to
              remain a team member?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleOwnershipDialogCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleOwnershipDialogNo}
              disabled={isSaving}
            >
              No
            </Button>
            <Button onClick={handleOwnershipDialogYes} disabled={isSaving}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showChangeOwnershipDialog}
        onOpenChange={(open) => {
          setShowChangeOwnershipDialog(open);
          if (!open) {
            setNewCreatorInDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Ownership</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <DebouncedSearchSelect<UserSearchItem>
              onSearch={(keyword) =>
                getUserSearchItemsExcludingCreator(keyword, initialCreator)
              }
              placeholder="Search for a new creator..."
              onChange={setNewCreatorInDialog}
              value={newCreatorInDialog}
              name="newCreator"
              getDisplayValue={(item) =>
                item.displayName
                  ? `${item.displayName} (${item.username})`
                  : item.username
              }
              getItemId={(item) => item.id || item.username}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeOwnershipDialog(false);
                setNewCreatorInDialog(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newCreatorInDialog) {
                  setSelectedCreator(newCreatorInDialog);
                }
                setShowChangeOwnershipDialog(false);
                setNewCreatorInDialog(null);
              }}
              disabled={!newCreatorInDialog}
            >
              Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
