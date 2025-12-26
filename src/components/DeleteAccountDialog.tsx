"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
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
import { Input } from "@/components/ui/input";
import { deleteUserAccount } from "@/lib/server_actions/auth_actions";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  userId: string;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  username,
  userId,
}: DeleteAccountDialogProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [usernameConfirmation, setUsernameConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMode, setDeleteMode] = useState<
    "account" | "accountAndEvents" | null
  >(null);

  const handleDelete = async (deleteEvents: boolean) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to delete your account");
      return;
    }

    // Validate username confirmation for self-deletion
    if (session.user.id === userId) {
      if (usernameConfirmation.toLowerCase() !== username.toLowerCase()) {
        toast.error("Username confirmation does not match");
        return;
      }
    }

    setIsDeleting(true);
    setDeleteMode(deleteEvents ? "accountAndEvents" : "account");

    try {
      const result = await deleteUserAccount(
        userId,
        deleteEvents,
        session.user.id === userId ? usernameConfirmation : undefined
      );

      if (result.success) {
        toast.success(
          deleteEvents
            ? "Account and all events deleted successfully"
            : "Account deleted successfully. Events transferred to admin."
        );

        // If user deleted their own account, sign them out and redirect
        if (session.user.id === userId) {
          await signOut({ redirect: true, callbackUrl: "/login" });
        } else {
          onOpenChange(false);
          router.refresh();
        }
      } else {
        toast.error(result.error || "Failed to delete account");
        setIsDeleting(false);
        setDeleteMode(null);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("An error occurred while deleting the account");
      setIsDeleting(false);
      setDeleteMode(null);
    }
  };

  const isSelfDeletion = session?.user?.id === userId;
  const isValidConfirmation =
    !isSelfDeletion ||
    usernameConfirmation.toLowerCase() === username.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-primary-dark">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            {isSelfDeletion
              ? "This action cannot be undone. Please type your username to confirm."
              : "This action cannot be undone. This will permanently delete the user account."}
          </DialogDescription>
        </DialogHeader>

        {isSelfDeletion && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type your username to confirm:{" "}
              <span className="font-mono">{username}</span>
            </label>
            <Input
              value={usernameConfirmation}
              onChange={(e) => setUsernameConfirmation(e.target.value)}
              placeholder={username}
              disabled={isDeleting}
              className={
                !isValidConfirmation && usernameConfirmation
                  ? "border-red-500"
                  : ""
              }
            />
            {!isValidConfirmation && usernameConfirmation && (
              <p className="text-sm text-red-500">Username does not match</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Choose deletion option:</p>
          <div className="space-y-2">
            <div className="p-3 border rounded">
              <p className="font-semibold text-sm">Delete only account</p>
              <p className="text-xs">
                Your events will be transferred to the admin account. All other
                data will be deleted.
              </p>
            </div>
            <div className="p-3 border rounded border-accent-orange">
              <p className="font-semibold text-sm">Delete account and events</p>
              <p className="text-xs">
                This will permanently delete your account and all events you
                created. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setUsernameConfirmation("");
              setDeleteMode(null);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleDelete(false)}
            disabled={isDeleting || (isSelfDeletion && !isValidConfirmation)}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isDeleting && deleteMode === "account"
              ? "Deleting..."
              : "Delete only account"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleDelete(true)}
            disabled={isDeleting || (isSelfDeletion && !isValidConfirmation)}
          >
            {isDeleting && deleteMode === "accountAndEvents"
              ? "Deleting..."
              : "Delete account and events"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
