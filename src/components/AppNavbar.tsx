"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { UserMenu } from "./UserMenu";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { NotificationPopover } from "./NotificationPopover";
import { ReportButton } from "./report/ReportButton";
import { Tv, HelpCircle, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MaintenanceLink } from "./MaintenanceLink";
import { SidebarTrigger } from "./ui/sidebar";

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
  {
    title: "About",
    url: "/about",
  },
];

export function AppNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  // Log client-side environment (only once on mount)
  useEffect(() => {
    const showTestLogin = process.env.NODE_ENV === "development";
    console.log("🌐 [CLIENT] Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      showTestLogin,
    });

    // Check window width on client side
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <nav className="z-100 border-primary-light border-b-3 bg-primary flex relative landscape:hidden">
      {/* Left section: Logo */}
      <div className="flex items-center gap-2 flex-shrink-0 z-10">
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
        <SidebarTrigger className="md:hidden text-white hover:text-white" />
      </div>

      {/* Center section: Nav menu - absolutely centered */}
      <div className="hidden md:flex items-center gap-2 justify-center absolute left-1/2 -translate-x-1/2 h-18 z-20 pointer-events-auto">
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
            >
              {item.title}
            </MaintenanceLink>
          );
        })}
      </div>

      {/* Right section: Actions */}
      <div className="flex h-18 px-2 md:px-4 py-2 items-center flex-1 justify-end z-10">
        <div className="flex items-center gap-x-2">
          <div className="flex gap-3 mr-0 md:mr-5">
            <Button
              asChild
              size="icon"
              className="bg-[#9d7eff] hover:bg-[#8d6eef] text-white border-none"
            >
              <MaintenanceLink href="/add-event">
                <Plus className="h-5 w-5" strokeWidth={3} />
              </MaintenanceLink>
            </Button>
            <Button asChild size="icon" variant="ghost">
              <MaintenanceLink href="/watch">
                <Tv className="h-5 w-5" />
              </MaintenanceLink>
            </Button>
            {!isMobile && <ReportButton className="cursor-pointer" />}
            {!isMobile && (
              <Button asChild size="icon" variant="ghost">
                <MaintenanceLink href="/help">
                  <HelpCircle className="h-5 w-5" />
                </MaintenanceLink>
              </Button>
            )}
            {session && <NotificationPopover />}
          </div>
          {session ? (
            <UserMenu session={session} />
          ) : (
            <>
              {/* Hide login/signup buttons on mobile when not logged in */}
              <MaintenanceLink href="/login">
                <Button size="default" variant="secondary">
                  Login
                </Button>
              </MaintenanceLink>
              <MaintenanceLink href="/signup">
                <Button size="default">Sign Up</Button>
              </MaintenanceLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
