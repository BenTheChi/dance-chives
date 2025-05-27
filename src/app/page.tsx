"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Home() {
    const { session } = useAuth();

    return (
        <div>
            <AppNavbar />
            {session ? (
                <div>
                    <header>
                        <h1>Home</h1>
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
