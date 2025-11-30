"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/server_actions/auth_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AppNavbar } from "@/components/AppNavbar";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (session) {
    return null;
  }

  const handleSendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!response.ok) {
        // We still show the same generic success message to avoid enumeration
        console.error("Magic link request failed", await response.text());
      }

      setMessage(
        "If that email exists, we've sent a magic login link. Please check your inbox."
      );
    } catch (err) {
      console.error("Error requesting magic link", err);
      setMessage(
        "If that email exists, we've sent a magic login link. Please check your inbox."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Sign in with Google or use a one-time magic link sent to your
              email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center"
              >
                <Image
                  src="/GLogo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Login with Google
              </Button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue with magic link
                </span>
              </div>
            </div>

            <form onSubmit={handleSendMagicLink} className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isSending}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}
              {message && !error && (
                <p className="text-sm text-green-600">{message}</p>
              )}
              <Button type="submit" className="w-full" disabled={isSending}>
                {isSending ? "Sending link..." : "Send magic link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
