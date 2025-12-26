"use client";

import { HomeIcon, LogOutIcon, UserIcon, SettingsIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface UserMenuProps {
  session: Session | null;
}

export function UserMenu({ session }: UserMenuProps) {
  const handleSignOut = async () => {
    // Sign out without automatic redirect
    await signOut({ redirect: false, callbackUrl: "/" });
    // Force page reload to ensure session state updates properly
    // This is especially important in dev mode
    window.location.href = "/";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full overflow-hidden border border-border hover:border-primary p-0"
        >
          {(session?.user?.avatar && session.user.avatar.trim() !== "") ||
          (session?.user?.image && session.user.image.trim() !== "") ? (
            <Image
              src={session.user.avatar || session.user.image || ""}
              alt={session.user.name || "User avatar"}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-semibold">
              {(session?.user?.displayName ||
                session?.user?.name ||
                session?.user?.email ||
                "U")[0].toUpperCase()}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
            asChild
          >
            <Link href="/dashboard">
              <HomeIcon className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          {session?.user?.username && (
            <>
              <Button
                variant="ghost"
                className="justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
                asChild
              >
                <Link href={`/profiles/${session.user.username}`}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
                asChild
              >
                <Link href="/settings">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={handleSignOut}
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
