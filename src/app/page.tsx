"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { getUser } from "@/db/queries/user";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Home() {
    const { session } = useAuth();

<<<<<<< HEAD
  return (
    <main>
      <header>
        <h1>Home</h1>
        <Link href="/add-event">
          <Button>Add Event</Button>
        </Link>
      </header>
      <section>Content here</section>
    </main>
  );
}
=======
    return (
        <div>
            <AppNavbar />
            {session ? (
                <>
                    <header>
                        <h1>Home</h1>
                        <Link href="/add-event">
                            <Button>Add Event</Button>
                        </Link>
                    </header>
                    <section>Content here</section>
                </>
            ) : (
                <div>Not logged in</div>
            )}
        </div>
    );
}
>>>>>>> 45bb2c7 (feat: remove sidebar profiles and add profile photo for topnavbar)
