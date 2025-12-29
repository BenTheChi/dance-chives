"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { UserMenu } from "./UserMenu";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { NotificationPopover } from "./NotificationPopover";
import { ReportButton } from "./report/ReportButton";
import { Search, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MaintenanceLink } from "./MaintenanceLink";

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

  return (
    <nav className="sticky top-0 z-50 border-primary-light border-b-3 bg-primary flex">
      <Link
        href="/"
        className="h-18 flex items-center px-2 py-1 hover:scale-105 transition-transform"
      >
        <Image
          src="/MainLogo_Color_onDark.svg"
          alt="Dance Chives Logo"
          width={2000}
          height={2000}
          className="h-full w-auto object-contain"
          priority
        />
      </Link>
      <div className="flex h-18 px-4 py-2 items-center w-full justify-between">
        {/* Centered nav menu items - hidden below sm */}
        <div className="hidden sm:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          {navMenuItems.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.url !== "/" && pathname.startsWith(item.url));

            return (
              <MaintenanceLink
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
                    "border-charcoal shadow-[4px_4px_0_0_rgb(49,49,49)] bg-primary-light text-primary",
                  !isActive &&
                    "text-white hover:bg-[#dfdfeb] hover:text-secondary-dark"
                )}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.title}
              </MaintenanceLink>
            );
          })}
        </div>

        {/* <div className="flex items-center gap-x-2 whitespace-nowrap">
          {session ? (
            <>
              <Button asChild size="icon" variant="ghost">
                <MaintenanceLink href="/search">
                  <Search className="h-5 w-5" />
                </MaintenanceLink>
              </Button>
              <ReportButton className="cursor-pointer" />
              <NotificationPopover />
              <Button asChild size="icon" variant="ghost">
                <MaintenanceLink href="/faq">
                  <HelpCircle className="h-5 w-5" />
                </MaintenanceLink>
              </Button>
              <UserMenu session={session} />
            </>
          ) : (
            <>
              <Button asChild size="icon" variant="ghost">
                <MaintenanceLink href="/search">
                  <Search className="h-5 w-5" />
                </MaintenanceLink>
              </Button>
              <ReportButton className="cursor-pointer" />
              <Button asChild size="icon" variant="ghost">
                <MaintenanceLink href="/faq">
                  <HelpCircle className="h-5 w-5" />
                </MaintenanceLink>
              </Button>
              <MaintenanceLink href="/login">
                <Button size="sm" variant="secondary">
                  Login
                </Button>
              </MaintenanceLink>
              <MaintenanceLink href="/signup">
                <Button size="sm">Sign Up</Button>
              </MaintenanceLink>
            </>
          )}
        </div> */}
      </div>
    </nav>
  );
}
