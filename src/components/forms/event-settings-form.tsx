"use client";

import { Control, UseFormSetValue } from "react-hook-form";
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
import { FormValues } from "./event-form";

export interface EventSettingsFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  teamMembers: UserSearchItem[];
  eventId: string;
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

export function EventSettingsForm({
  setValue,
  teamMembers,
  eventId,
}: EventSettingsFormProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleTeamMembersChange = (newTeamMembers: UserSearchItem[]) => {
    // Update form state - changes will be saved on form submission
    setValue("teamMembers", newTeamMembers, { shouldValidate: false });
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

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Team Members</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage team members who have edit access to this event. Changes will
            be saved when you submit the form.
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

        {eventId && (
          <div className="border-t pt-4">
            <Button
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
