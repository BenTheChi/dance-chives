"use client";
import { AppNavbar } from "@/components/AppNavbar";
import { useAuth } from "@/components/providers/AuthProvider";
import { redirect } from "next/navigation";

export default function DashboardPage() {
    const { session } = useAuth();

    if (!session) {
        redirect("/login");
    }

    return (
        <>
            <AppNavbar />
            <header>Dashboard Page</header>
            <main>
                <section>
                    <h1>Dashboard</h1>
                    <p>Dashboard info here</p>
                </section>
            </main>
        </>
    );
}
