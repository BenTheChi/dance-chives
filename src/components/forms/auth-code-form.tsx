"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { getAuthLevelName } from "@/lib/utils/auth-utils";

export function InvitationStatusCard() {
  const { data: session } = useSession();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authorization Status</CardTitle>
        <CardDescription>
          Your current authorization level and upgrade information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <p className="font-medium">
            Current Level: {session?.user?.auth || 0}
          </p>
          <p className="text-sm text-muted-foreground">
            {getAuthLevelName(session?.user?.auth || 0)}
          </p>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">How to Upgrade:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Contact an administrator for an invitation</li>
            <li>• Check your email for invitation links</li>
            <li>• Invitations are sent directly to your registered email</li>
          </ul>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          Authorization upgrades are now invitation-based for better security.
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminInvitationGenerator() {
  const [email, setEmail] = useState("");
  const [authLevel, setAuthLevel] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [generatedInvitation, setGeneratedInvitation] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/create-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), authLevel, expiresInDays }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedInvitation(result.invitation);
        toast.success("Invitation sent successfully!");
        setEmail(""); // Clear the form
      } else {
        toast.error(result.error || "Failed to create invitation");
      }
    } catch (error) {
      console.error("Invitation creation error:", error);
      toast.error("An error occurred while creating the invitation");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedInvitation?.magicLink) {
      await navigator.clipboard.writeText(generatedInvitation.magicLink);
      toast.success("Invitation link copied to clipboard!");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Send Invitation</CardTitle>
        <CardDescription>
          Invite users to upgrade their authorization level via email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authLevel">Auth Level</Label>
            <Input
              id="authLevel"
              type="number"
              min="1"
              max="10"
              value={authLevel}
              onChange={(e) => setAuthLevel(parseInt(e.target.value) || 1)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires">Expires in Days</Label>
            <Input
              id="expires"
              type="number"
              min="1"
              max="30"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </form>

        {generatedInvitation && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <Label className="text-sm font-medium">Invitation Created:</Label>
            <div className="mt-2 space-y-2 text-sm">
              <p>
                <strong>Email:</strong> {generatedInvitation.email}
              </p>
              <p>
                <strong>Auth Level:</strong> {generatedInvitation.authLevel}
              </p>
              <p>
                <strong>Expires:</strong>{" "}
                {new Date(generatedInvitation.expires).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 font-mono text-xs bg-background p-2 rounded border overflow-hidden">
                {generatedInvitation.magicLink}
              </code>
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              📧 Email would be sent via SendGrid in production
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
