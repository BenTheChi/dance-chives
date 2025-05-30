"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { UserMenu } from "./UserMenu";
import { useAuth } from "./providers/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "./ui/sidebar";

export function AppNavbar() {
  const { session } = useAuth();

  return (
    <nav className="border-b bg-sidebar px-4">
      <div className="flex h-14 items-center w-full justify-between">
        {/* Search + Category Dropdown */}
        <div className="flex items-center gap-0">
          <SidebarTrigger className="mr-4 border-1 border-grey cursor-pointer" />

          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="rounded-r-none bg-background pl-8 md:w-[200px] lg:w-[300px]"
            />
          </div>

          <Select defaultValue="events">
            <SelectTrigger className="w-[160px] rounded-l-none">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="series">Series</SelectItem>
              <SelectItem value="members">Members</SelectItem>
              <SelectItem value="workshops">Workshops/Classes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-x-2 whitespace-nowrap">
          {session ? (
            <UserMenu session={session} />
          ) : (
            <>
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" variant="outline">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
