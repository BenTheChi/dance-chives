"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { UserMenu } from "./UserMenu";
import { useSession } from "next-auth/react";
import { SidebarTrigger } from "./ui/sidebar";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { useEffect } from "react";
import { NotificationPopover } from "./NotificationPopover";
import { ReportButton } from "./report/ReportButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navMenuItems = [
  {
    title: "Events",
    url: "/events",
  },
  {
    title: "Calendar",
    url: "/calendar",
  },
  {
    title: "Community",
    url: "/profiles",
  },
];

export function AppNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Log client-side environment (only once on mount)
  useEffect(() => {
    const showTestLogin = process.env.NODE_ENV === "development";
    console.log("🌐 [CLIENT] Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      showTestLogin,
    });
  }, []);

  const user = session?.user;
  const authLevel = user?.auth ?? 0;
  const canCreateEvents = authLevel >= AUTH_LEVELS.CREATOR;

  return (
    <nav className="sticky top-0 z-50 border-primary-light border-b-3 bg-primary px-4 py-2">
      <div className="flex h-14 items-center w-full justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="border-1 border-grey cursor-pointer sm:hidden" />
          {canCreateEvents && (
            <Button
              asChild
              className="hidden sm:inline-flex"
              variant="secondary"
            >
              <Link href="/add-event">Add Event</Link>
            </Button>
          )}
        </div>

        {/* Centered nav menu items - hidden below sm */}
        <div className="hidden sm:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          {navMenuItems.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.url !== "/" && pathname.startsWith(item.url));

            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "px-4 py-2 rounded-sm transition-all duration-200",
                  "border-2 border-transparent",
                  "hover:border-charcoal hover:shadow-[4px_4px_0_0_rgb(49,49,49)]",
                  "active:shadow-[2px_2px_0_0_rgb(49,49,49)]",
                  "text-base font-bold uppercase tracking-wide",
                  "font-display",
                  isActive &&
                    "border-charcoal shadow-[4px_4px_0_0_rgb(49,49,49)] bg-mint text-primary",
                  !isActive &&
                    "text-secondary-light hover:bg-[#dfdfeb] hover:text-periwinkle"
                )}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.title}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-x-2 whitespace-nowrap">
          {session ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" variant="ghost">
                    <Link href="/search">
                      <Search className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ReportButton />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Report Issue</p>
                </TooltipContent>
              </Tooltip>
              <NotificationPopover />
              <UserMenu session={session} />
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" variant="ghost">
                    <Link href="/search">
                      <Search className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ReportButton />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Report Issue</p>
                </TooltipContent>
              </Tooltip>
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" variant="secondary">
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
