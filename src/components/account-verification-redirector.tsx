"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { isAccountVerified } from "@/lib/utils/auth-utils-shared";

const EXEMPT_PATHS = ["/signup", "/login"];

export function AccountVerificationRedirector() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (!session || !session.user) {
      return;
    }

    if (isAccountVerified(session)) {
      return;
    }

    if (EXEMPT_PATHS.includes(pathname)) {
      return;
    }

    router.replace("/signup");
  }, [status, session, pathname, router]);

  return null;
}
