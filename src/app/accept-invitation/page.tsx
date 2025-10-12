"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AUTH_LEVELS, getAuthLevelName } from "@/lib/utils/auth-utils";

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid invitation link");
      router.push("/");
      return;
    }

    if (!session) {
      // Redirect to login with return URL
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.href)}`
      );
      return;
    }
  }, [token, session, router]);

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `🎉 Invitation accepted! Your auth level is now ${
            result.newAuthLevel
          } (${getAuthLevelName(result.newAuthLevel)})`
        );

        // Update the session to reflect the new auth level
        await update();

        // Store invitation data for display
        setInvitationData(result);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        toast.error(result.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Invitation acceptance error:", error);
      toast.error("An error occurred while accepting the invitation");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to accept your invitation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or missing.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitationData) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>🎉 Invitation Accepted!</CardTitle>
            <CardDescription>
              Your authorization level has been updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">
                New Auth Level: {invitationData.newAuthLevel}
              </p>
              <p className="text-sm text-muted-foreground">
                {getAuthLevelName(invitationData.newAuthLevel)}
              </p>
              {invitationData.invitedBy && (
                <p className="text-sm text-muted-foreground">
                  Invited by: {invitationData.invitedBy}
                </p>
              )}
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Redirecting to dashboard in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to upgrade your authorization level.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="font-medium">
              Signed in as: {session.user?.name || session.user?.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Current auth level: {session.user?.auth || 0} (
              {getAuthLevelName(session.user?.auth || 0)})
            </p>
          </div>

          <Button
            onClick={handleAcceptInvitation}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Accepting..." : "Accept Invitation"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By accepting this invitation, your authorization level will be
            updated according to the invitation details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
