"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";

export function SettingsClient() {
  const { data: session } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <div className="space-y-6 max-w-2xl mx-auto">
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Email</p>
              <p className="font-mono">{session.user.email}</p>
            </div>
            {session.user.username && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Username</p>
                <p className="font-mono">{session.user.username}</p>
              </div>
            )}
            {session.user.displayName && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Display Name</p>
                <p>{session.user.displayName}</p>
              </div>
            )}
          </div>
        </section>

        <section className="border rounded-lg p-6 border-red-500">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </section>
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

