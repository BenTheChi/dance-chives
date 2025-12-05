"use client";

import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
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
import { updateEventTeamMembers } from "@/lib/server_actions/event_actions";

export interface EventSettingsFormProps {
  eventId: string;
  initialTeamMembers: UserSearchItem[];
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

export default function EventSettingsForm({
  eventId,
  initialTeamMembers,
}: EventSettingsFormProps) {
  const router = useRouter();
  const [teamMembers, setTeamMembers] =
    useState<UserSearchItem[]>(initialTeamMembers);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleTeamMembersChange = (newTeamMembers: UserSearchItem[]) => {
    setTeamMembers(newTeamMembers);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateEventTeamMembers(eventId, teamMembers);
      if (result.status === 200) {
        toast.success("Team members updated successfully");
        router.push(`/events/${eventId}`);
      } else {
        toast.error(result.error || "Failed to update team members");
      }
    } catch (error) {
      console.error("Error updating team members:", error);
      toast.error("Failed to update team members");
    } finally {
      setIsSaving(false);
    }
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

  const hasChanges =
    JSON.stringify(teamMembers) !== JSON.stringify(initialTeamMembers);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Team Members</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage team members who have edit access to this event.
          </p>
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
              onClick={() => setTeamMembers(initialTeamMembers)}
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
    </div>
  );
}
