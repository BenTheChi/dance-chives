"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { signInWithGoogle } from "@/lib/server_actions/auth_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import SignUpForm from "./signup-form";

export function SignupContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRefreshedSession, setHasRefreshedSession] = useState(false);

  const fromMagicLink = searchParams.get("fromMagicLink") === "true";

  // Refresh session if coming from magic link
  useEffect(() => {
    if (fromMagicLink && update && !hasRefreshedSession) {
      setHasRefreshedSession(true);
      update().finally(() => {
        // Remove the query parameter after refreshing
        router.replace("/signup");
      });
    }
  }, [fromMagicLink, update, router, hasRefreshedSession]);

  useEffect(() => {
    if (session?.user.username) {
      router.push("/dashboard");
    }
  }, [session, router]);

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
        "If that email exists, we've sent a magic signup link. Please check your inbox."
      );
    } catch (err) {
      console.error("Error requesting magic link", err);
      setMessage(
        "If that email exists, we've sent a magic signup link. Please check your inbox."
      );
    } finally {
      setIsSending(false);
    }
  };

  // User is neither logged in nor registered
  if (!session) {
    // If we just came from a magic link, wait for the session refresh
    if (fromMagicLink && (!hasRefreshedSession || status === "loading")) {
      return (
        <div className="flex flex-col items-center justify-center w-full">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Finishing your signup...
              </CardTitle>
              <CardDescription className="text-center">
                Please wait while we finalize your session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                This should only take a moment.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center w-full">
        <Card className="w-full max-w-md bg-primary">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Create your account
            </CardTitle>
            <CardDescription className="text-center">
              Sign up with Google or use a one-time magic link to create your
              account.
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
                Sign up with Google
              </Button>
            </div>

            <hr className="my-4 border-black" />

            <div className="text-muted-foreground text-center mb-0">
              Or sign up with magic link
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
                {isSending ? "Sending link..." : "Send signup link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If the user is logged in, but not registered show the signup form
  return (
    <div className="flex items-start justify-center w-full max-w-4xl px-4 py-5">
      <SignUpForm />
    </div>
  );
}
