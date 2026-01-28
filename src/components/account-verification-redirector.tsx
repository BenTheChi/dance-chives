"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { isAccountVerified } from "@/lib/utils/auth-utils-shared";

const EXEMPT_PATHS = [
  "/signup",
  "/login",
  "/terms",
  "/privacy",
  "/content-usage",
];

export function AccountVerificationRedirector() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for session to be fully loaded
    if (status === "loading") {
      return;
    }

    // Only proceed if authenticated
    if (status !== "authenticated") {
      return;
    }

    if (!session || !session.user) {
      return;
    }

    // Don't redirect if user is already verified
    if (isAccountVerified(session)) {
      return;
    }

    // Don't redirect if already on an exempt path
    if (EXEMPT_PATHS.includes(pathname)) {
      return;
    }

    router.replace("/signup");
  }, [status, session, pathname, router]);

  return null;
}
