"use client";

import { CalendarIcon, HouseIcon, Users, Info } from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { MaintenanceLink } from "./MaintenanceLink";

const menuItems = [
  {
    title: "Events",
    url: "/events",
    icon: HouseIcon,
    iconRotation: -3,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: CalendarIcon,
    iconRotation: 2,
  },
  {
    title: "Community",
    url: "/profiles",
    icon: Users,
    iconRotation: 3,
  },
  {
    title: "About",
    url: "/about",
    icon: Info,
    iconRotation: 0,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === "collapsed";
  const { data: session } = useSession();
  const user = session?.user;
  const authLevel = user?.auth ?? 0;
  const canCreateEvents = authLevel >= AUTH_LEVELS.CREATOR;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:pt-[1px] group-data-[collapsible=icon]:pb-[1px] group-data-[collapsible=icon]:h-14">
        <Link
          href="/"
          className="flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Image
            src="/MainLogo_Color_onLight.svg"
            alt="Dance Chives"
            width={220}
            height={220}
          />
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-start group-data-[collapsible=icon]:justify-start">
        <SidebarGroup className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-start group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:h-full">
          <SidebarGroupContent className="group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:h-full">
            <SidebarMenu className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-start group-data-[collapsible=icon]:pt-[25px] group-data-[collapsible=icon]:h-full">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));

                return (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn(
                      "group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:hover:border-t-2 group-data-[collapsible=icon]:hover:border-b-2 group-data-[collapsible=icon]:hover:border-charcoal group-data-[collapsible=icon]:hover:border-x-0 group-data-[collapsible=icon]:h-15 flex flex-col items-center",
                      !isActive &&
                        "group-data-[collapsible=icon]:hover:bg-[#dfdfeb]"
                    )}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "flex flex-col gap-5 h-fit py-6 px-4 rounded-sm transition-all duration-200",
                        "group-data-[collapsible=icon]:rounded-none",
                        "border-2 border-transparent",
                        "hover:border-charcoal hover:shadow-[4px_4px_0_0_rgb(49,49,49)]",
                        "active:shadow-[2px_2px_0_0_rgb(49,49,49)]",
                        "group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:shadow-none",
                        "group-data-[collapsible=icon]:hover:border-transparent group-data-[collapsible=icon]:hover:shadow-none",
                        "group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-full",
                        "group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:pb-0 group-data-[collapsible=icon]:h-auto",
                        isActive &&
                          "border-charcoal shadow-[4px_4px_0_0_rgb(49,49,49)] bg-mint",
                        isActive &&
                          "group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:bg-transparent",
                        isActive &&
                          "group-data-[collapsible=icon]:hover:!bg-transparent",
                        !isActive &&
                          "hover:bg-[#dfdfeb] group-data-[collapsible=icon]:hover:bg-transparent"
                      )}
                    >
                      <Link
                        href={item.url}
                        className="flex flex-col items-center gap-2 w-full group/link group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-start group-data-[collapsible=icon]:gap-0"
                      >
                        <div
                          className={cn(
                            "relative sidebar-icon-wrapper",
                            isActive && "active"
                          )}
                          style={
                            {
                              "--base-rotation": `${item.iconRotation}deg`,
                              transform: `rotate(var(--base-rotation))`,
                            } as React.CSSProperties & {
                              "--base-rotation": string;
                            }
                          }
                        >
                          <item.icon
                            className={cn(
                              "w-8 h-8 transition-all duration-200",
                              "stroke-[2]",
                              isActive && "scale-110 text-charcoal",
                              !isActive &&
                                "text-primary-dark group-hover/link:scale-110"
                            )}
                          />
                          {isActive && (
                            <div className="absolute inset-0 -z-10 bg-periwinkle/20 rounded-full scale-125 blur-sm group-data-[collapsible=icon]:hidden" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-base font-bold uppercase tracking-wide transition-colors",
                            "font-display",
                            isActive && "text-charcoal",
                            !isActive && "text-primary-dark"
                          )}
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 flex flex-col gap-2">
        {canCreateEvents && (
          <Button asChild className="w-full sm:hidden">
            <Link href="/add-event">Add Event</Link>
          </Button>
        )}
        {/* Show login/signup buttons on mobile when not logged in */}
        {!session && (
          <>
            <MaintenanceLink href="/login" className="w-full md:hidden">
              <Button variant="secondary" className="w-full">
                Login
              </Button>
            </MaintenanceLink>
            <MaintenanceLink href="/signup" className="w-full md:hidden">
              <Button className="w-full">Sign Up</Button>
            </MaintenanceLink>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
