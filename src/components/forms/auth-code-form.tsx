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

export function AuthCodeForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session, update } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Please enter an auth code");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/use-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Auth level updated to ${result.newAuthLevel}!`);
        setCode("");
        // Update the session to reflect the new auth level
        await update();
        // Optionally refresh the page
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(result.error || "Failed to use auth code");
      }
    } catch (error) {
      console.error("Auth code error:", error);
      toast.error("An error occurred while applying the auth code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Upgrade Authorization</CardTitle>
        <CardDescription>
          Enter an authorization code to upgrade your access level.
          {session?.user?.auth && (
            <span className="block mt-1 text-sm font-medium">
              Current level: {session.user.auth}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authCode">Authorization Code</Label>
            <Input
              id="authCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter auth code"
              disabled={loading}
              className="font-mono"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full"
          >
            {loading ? "Applying..." : "Apply Auth Code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminAuthCodeGenerator() {
  const [level, setLevel] = useState(1);
  const [uses, setUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/create-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, uses, expiresInDays }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedCode(result.authCode.code);
        toast.success("Auth code generated successfully!");
      } else {
        toast.error(result.error || "Failed to generate auth code");
      }
    } catch (error) {
      console.error("Code generation error:", error);
      toast.error("An error occurred while generating the auth code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode);
      toast.success("Code copied to clipboard!");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Generate Auth Code</CardTitle>
        <CardDescription>
          Create authorization codes for users to upgrade their access levels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="level">Auth Level</Label>
            <Input
              id="level"
              type="number"
              min="1"
              max="10"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uses">Number of Uses</Label>
            <Input
              id="uses"
              type="number"
              min="1"
              value={uses}
              onChange={(e) => setUses(parseInt(e.target.value) || 1)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires">Expires in Days</Label>
            <Input
              id="expires"
              type="number"
              min="1"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 1)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Generating..." : "Generate Code"}
          </Button>
        </form>

        {generatedCode && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <Label className="text-sm font-medium">Generated Code:</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 font-mono text-sm bg-background p-2 rounded border">
                {generatedCode}
              </code>
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
