"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AppNavbar() {
    return (
        <nav className="border-b bg-sidebar px-4">
            <div className="flex h-14 space-between items-center w-full">
                <div className="relative mr-8">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full bg-background pl-8 md:w-[200px] lg:w-[300px]"
                    />
                </div>
                <div className="flex items-center space-x-8 text-lg font-medium mr-8">
                    <Link
                        href="/events"
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Events
                    </Link>
                    <Link
                        href="/series"
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Series
                    </Link>
                    <Link
                        href="/people"
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        People
                    </Link>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                    <Button variant="ghost" size="sm">
                        Login
                    </Button>
                    <Button size="sm">Sign up</Button>
                </div>
            </div>
        </nav>
    );
}
