"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div>
      <AppNavbar />
      {session ? (
        <div>
          <header>
            <h1>Home Dev Test</h1>
            <Link href="/add-event">
              <Button>Add Event</Button>
            </Link>
          </header>
          <section>Content here</section>
        </div>
      ) : (
        <div>Not logged in</div>
      )}
    </div>
  );
}
