"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { usePathname } from "next/navigation";
import {
    signInWithGoogle,
    signOutAccount,
} from "@/lib/server_actions/auth_actions";
import Image from "next/image";

const menuItems = [
    { label: "Events", href: "/events" },
    { label: "Series", href: "/series" },
    { label: "People", href: "/people" },
];

export function AppNavbar() {
    if (usePathname() === "/signup") {
        return <></>;
    }

    const isAuthenticated = false;

    return (
        <nav className="border-b bg-sidebar px-4">
            <div className="flex h-14 items-center w-full justify-between">
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full bg-background pl-8 md:w-[200px] lg:w-[300px]"
                    />
                </div>
                <div className="flex items-center space-x-8 text-md font-medium">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
                <div className="flex items-center gap-x-2 whitespace-nowrap">
                    {isAuthenticated ? (
                        <Button
                            size="sm"
                            className="w-full cursor-pointer"
                            onClick={signOutAccount}
                        >
                            Logout
                        </Button>
                    ) : (
                        <Button
                            size="sm"
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
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}
