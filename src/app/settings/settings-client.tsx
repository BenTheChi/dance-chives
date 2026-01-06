"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { updateOptOutOfMarketing } from "@/lib/server_actions/auth_actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface SettingsClientProps {
  initialOptOutOfMarketing: boolean;
}

export function SettingsClient({
  initialOptOutOfMarketing,
}: SettingsClientProps) {
  const { data: session } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [optOutOfMarketing, setOptOutOfMarketing] = useState(
    initialOptOutOfMarketing
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!session?.user) {
    return null;
  }

  const hasChanges = optOutOfMarketing !== initialOptOutOfMarketing;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateOptOutOfMarketing(optOutOfMarketing);
      if (result.success) {
        toast.success("Settings updated successfully");
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 max-w-md mx-auto w-full bg-primary rounded-sm p-6">
        <div className="space-y-10">
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h2>Email</h2>
                <p className="font-mono">{session.user.email}</p>
              </div>
              {session.user.username && (
                <div className="space-y-2">
                  <h2>Username</h2>
                  <p className="font-mono">{session.user.username}</p>
                </div>
              )}
              {session.user.displayName && (
                <div className="space-y-2">
                  <h2>Display Name</h2>
                  <p>{session.user.displayName}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2">Opt Out of Marketing</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="optOutOfMarketing"
                checked={optOutOfMarketing}
                onCheckedChange={(checked) =>
                  setOptOutOfMarketing(checked === true)
                }
              />
              <Label
                htmlFor="optOutOfMarketing"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Opt out of marketing emails
              </Label>
            </div>
          </div>

          {hasChanges && (
            <div className="flex gap-4 pt-4">
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOptOutOfMarketing(initialOptOutOfMarketing)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="border-t pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {session.user.id && session.user.username && (
        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          username={session.user.username}
          userId={session.user.id}
        />
      )}
    </>
  );
}
