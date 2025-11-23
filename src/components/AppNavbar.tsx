"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { UserMenu } from "./UserMenu";
import { useSession } from "next-auth/react";
import { SidebarTrigger } from "./ui/sidebar";
import { TestLoginDropdown } from "./TestLoginDropdown";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

export function AppNavbar() {
  const { data: session } = useSession();

  const user = session?.user;
  const authLevel = user?.auth ?? 0;
  const canCreateEvents = authLevel >= AUTH_LEVELS.CREATOR;

  return (
    <nav className="border-b bg-sidebar px-4">
      <div className="flex h-14 items-center w-full justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="border-1 border-grey cursor-pointer" />
          {canCreateEvents && (
            <Button asChild>
              <Link href="/add-event">Add Event</Link>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-x-2 whitespace-nowrap">
          {session ? (
            <UserMenu session={session} />
          ) : (
            <>
              {process.env.NODE_ENV === "development" && <TestLoginDropdown />}
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" variant="outline">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
