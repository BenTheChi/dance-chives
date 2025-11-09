"use client";

import { AppNavbar } from "@/components/AppNavbar";
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
          </header>
          <section>Content here</section>
        </div>
      ) : (
        <div>Not logged in</div>
      )}
    </div>
  );
}
