"use client";

import { HomeIcon, LogOutIcon, UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  session: Session | null;
}

export function UserMenu({ session }: UserMenuProps) {
  const router = useRouter();

  const navigateToDashboard = () => {
    router.push("/dashboard");
  };

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
          className="relative h-8 w-8 rounded-full overflow-hidden border border-border hover:border-primary"
        >
          {session?.user?.image && session.user.image.trim() !== "" ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User avatar"}
              width={32}
              height={32}
              className="object-cover"
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
            className="justify-start"
            onClick={navigateToDashboard}
          >
            <HomeIcon className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          {session?.user?.username && (
            <>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => router.push(`/profiles/${session.user.username}`)}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start"
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
