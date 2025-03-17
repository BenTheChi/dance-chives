"use client";

import { Link, LogInIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";

export function LoginButton() {
  const { state } = useSidebar();

  return (
    <Link href="/login" className="w-full">
      {state === "collapsed" ? (
        <LogInIcon className="w-80 h-80" />
      ) : (
        <Button className="bg-orange-400 w-full cursor-pointer">Login</Button>
      )}
    </Link>
  );
}
