"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isAccountVerified } from "@/lib/utils/auth-utils";

interface AccountVerificationGuardProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function AccountVerificationGuard({
  children,
  requireVerification = false,
}: AccountVerificationGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/login");
      return;
    }

    if (requireVerification && !isAccountVerified(session)) {
      router.push("/signup");
      return;
    }
  }, [session, status, router, requireVerification]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login required
  if (!session) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show verification required
  if (requireVerification && !isAccountVerified(session)) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Registration</CardTitle>
            <CardDescription>
              Please complete your profile to verify your account and access
              this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                You've successfully signed in with OAuth, but you need to
                complete your registration to access all features.
              </p>
            </div>
            <Button onClick={() => router.push("/signup")} className="w-full">
              Complete Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}
