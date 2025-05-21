"use client";

import { LogOutIcon, UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import { signOutAccount } from "@/lib/server_actions/auth_actions";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function UserMenu() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                >
                    <UserIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
                <div className="flex flex-col gap-2">
                    <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={signOutAccount}
                    >
                        <LogOutIcon className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
