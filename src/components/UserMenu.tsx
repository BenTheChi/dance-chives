"use client";

import { HomeIcon, LogOutIcon, UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import { signOutAccount } from "@/lib/server_actions/auth_actions";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";

interface UserMenuProps {
    session: Session | null;
}

export function UserMenu({ session }: UserMenuProps) {
    const router = useRouter();

    const navigateToDashboard = () => {
        router.push("/dashboard");
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full overflow-hidden border border-border hover:border-primary"
                >
                    {session?.user?.image ? (
                        <Image
                            src={session.user.image}
                            alt={session.user.name || "User avatar"}
                            width={32}
                            height={32}
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <UserIcon className="h-4 w-4" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
                <div className="flex flex-col gap-2">
                    <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={navigateToDashboard}
                    >
                        <HomeIcon className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>
                </div>
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
