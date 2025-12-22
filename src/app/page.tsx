"use client";

import { AppNavbar } from "@/components/AppNavbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <img
          src="/AltLogo_Color_onDark.svg"
          alt="Dance Chives Logo"
          className="w-full max-w-4xl h-auto object-contain"
        />
      </main>
    </div>
  );
}
