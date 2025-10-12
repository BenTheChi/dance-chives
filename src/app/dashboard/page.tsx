"use client";
import { AppNavbar } from "@/components/AppNavbar";
import { AccountVerificationGuard } from "@/components/AccountVerificationGuard";

export default function DashboardPage() {
  return (
    <AccountVerificationGuard requireVerification={true}>
      <AppNavbar />
      <header>Dashboard Page</header>
      <main>
        <section>
          <h1>Dashboard</h1>
          <p>
            Welcome to your dashboard! Your account is verified and you have
            full access.
          </p>
        </section>
      </main>
    </AccountVerificationGuard>
  );
}
