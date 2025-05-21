"use client";

import { BookIcon, SearchIcon } from "lucide-react";
import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    Sidebar,
    SidebarHeader,
    useSidebar,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";

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
                    <Image
                        src="/logo.svg"
                        alt="Dance Chives"
                        width={220}
                        height={220}
                    />
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
                                            <span className="text-lg">
                                                {item.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
