"use client";

import {
  BookIcon,
  LogInIcon,
  LogOutIcon,
  SearchIcon,
  SquareArrowDown,
  SquareArrowUp,
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
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
import { Button } from "./ui/button";
import {
  signInWithGoogle,
  signOutAccount,
} from "@/lib/server_actions/auth_actions";

import { usePathname } from "next/navigation";

const menuItems = [
  { title: "Search", url: "/search", icon: SearchIcon },
  { title: "Education", url: "/styles", icon: BookIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();

  if (usePathname() === "/signup") {
    return <></>;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="mb-2">
        <Link href="/" className="flex items-center justify-center">
          <Image src="/logo.svg" alt="Dance Chives" width={220} height={220} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="flex flex-col h-fit hover:border-l-2 hover:border-l-black hover:rounded-l-none py-5"
                  >
                    <Link href={item.url}>
                      <item.icon className="w-80 h-80" />
                      <span className="text-lg">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col align-center pb-5">
        <SidebarMenuButton asChild>
          {state === "collapsed" ? (
            <LogInIcon className="w-80 h-80" />
          ) : (
            <Button
              className="w-full cursor-pointer"
              onClick={signInWithGoogle}
            >
              <Image
                src="/GLogo.svg"
                alt="Google"
                width={20}
                height={20}
                className="mr-2"
              />
              Signup/Login with Google
            </Button>
          )}
        </SidebarMenuButton>
        <SidebarMenuButton asChild>
          {state === "collapsed" ? (
            <LogOutIcon className="w-80 h-80" />
          ) : (
            <Button className="w-full cursor-pointer" onClick={signOutAccount}>
              Logout
            </Button>
          )}
        </SidebarMenuButton>

        {/* <SidebarMenuButton asChild>
          <Link href="/signup" className="w-full">
            {state === "collapsed" ? (
              <SquareArrowUp className="w-80 h-80" />
            ) : (
              <Button className="bg-blue-400 w-full cursor-pointer">
                Sign up
              </Button>
            )}
          </Link>
        </SidebarMenuButton> */}
      </SidebarFooter>
    </Sidebar>
  );
}
