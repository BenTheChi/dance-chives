"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Status = "loading" | "error";

export default function MagicLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState(
    "Signing you in with your magic link..."
  );

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("This magic link is invalid. Please request a new one.");
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch("/api/auth/magic-link/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          setStatus("error");
          setMessage(
            "This magic link is invalid or has expired. Please request a new one."
          );
          return;
        }

        const data = await response.json();
        const redirectPath =
          data.redirectPath || (data.needsProfile ? "/signup" : "/dashboard");

        router.replace(redirectPath);
      } catch (error) {
        console.error("Error verifying magic link:", error);
        setStatus("error");
        setMessage(
          "This magic link is invalid or has expired. Please request a new one."
        );
      }
    };

    verify();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" ? "Signing you in..." : "Magic link error"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
          {status === "error" && (
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/login">Back to login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


