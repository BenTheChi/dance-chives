"use client";

import {
  BookIcon,
  LogOutIcon,
  LogInIcon,
  SearchIcon,
  SquareArrowUp,
} from "lucide-react";
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
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import { Skeleton } from "./ui/skeleton";

const menuItems = [
  { title: "Search", url: "/search", icon: SearchIcon },
  { title: "Education", url: "/styles", icon: BookIcon },
];
// function a(){
//   console.log()
// }
export function AppSidebar() {
  const { state } = useSidebar();

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
        <AuthStatusSidebar collapsed={state === "collapsed"} />
      </SidebarFooter>
    </Sidebar>
  );
}

// TODO : Handle google auth manually using onclick await auth('google') to avoid api path
function AuthStatusSidebar({ collapsed }: { collapsed: boolean }) {
  const { status, data: session } = useSession();

  if (status === "loading") return <Skeleton />;

  if (status === "authenticated") {
    return (
      <div className="flex flex-col items-center w-full gap-2 px-2">
        <div className="flex items-center gap-3 w-full px-2">
          <Image
            src={session.user?.image || "/profile-icon.png"}
            alt="avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
          {!collapsed && (
            <span className="text-sm truncate">{session.user?.name}</span>
          )}
        </div>
        <Link href="/api/auth/signout" className="w-full">
          <Button className="w-full text-sm bg-amber-400 cursor-pointer">
            {collapsed ? (
              <LogOutIcon className="w-4 h-4" />
            ) : (
              <>
                <LogOutIcon className="w-4 h-4" /> Log out
              </>
            )}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-2 px-2">
      <Link href="/api/auth/signin">
        <Button className="bg-sky-400  w-full text-sm cursor-pointer">
          {collapsed ? (
            <LogInIcon className="w-4 h-4" />
          ) : (
            <>
              <LogInIcon className="w-4 h-4" /> Login with google
            </>
          )}
        </Button>
      </Link>

      <Link href="/signup">
        <Button className="bg-blue-400 w-full  text-sm cursor-pointer">
          {collapsed ? (
            <SquareArrowUp className="w-4 h-4" />
          ) : (
            <>
              <SquareArrowUp className="w-4 h-4" /> Sign up
            </>
          )}
        </Button>
      </Link>
    </div>
  );
}
