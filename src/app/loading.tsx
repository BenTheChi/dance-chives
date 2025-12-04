"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Loading() {
  const pathname = usePathname();

  // Determine loading message based on path
  const getLoadingMessage = () => {
    if (pathname?.includes("/events/") && pathname?.includes("/edit")) {
      return "Loading Edit Event Form";
    }
    if (pathname?.includes("/profiles/") && pathname?.includes("/edit")) {
      return "Loading Edit Profile Form";
    }
    if (pathname?.includes("/events/") && !pathname?.includes("/edit")) {
      return "Event Loading";
    }
    if (pathname === "/dashboard") {
      return "Dashboard Loading";
    }
    if (pathname?.includes("/add-event")) {
      return "Loading Event Form";
    }
    // Default fallback
    return "Loading...";
  };

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col justify-center items-center gap-4 py-20 px-4">
        <h1 className="text-2xl font-bold">{getLoadingMessage()}</h1>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    </>
  );
}
