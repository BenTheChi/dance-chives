"use client";

import { Button } from "@/components/ui/button";
import { MaintenanceLink } from "@/components/MaintenanceLink";
import { useSession } from "next-auth/react";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";

interface HomePageCTAProps {
  variant?: "primary" | "secondary";
}

export function HomePageCTA({ variant = "primary" }: HomePageCTAProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const authLevel = user?.auth ?? 0;
  const canCreateEvents = authLevel >= AUTH_LEVELS.CREATOR;

  // When logged in and can create events, show "Add an Event"
  if (session && canCreateEvents) {
    return (
      <section className="w-full mx-auto text-center">
        <MaintenanceLink href="/add-event">
          <Button
            size="xl"
            className="font-rubik-mono-one text-base sm:text-xl md:!text-2xl text-charcoal px-4 sm:px-6 md:px-10"
          >
            Add an Event
          </Button>
        </MaintenanceLink>
      </section>
    );
  }

  // When logged in but can't create events, hide the CTA
  if (session) {
    return null;
  }

  // When not logged in, show sign up CTA
  return (
    <section className="w-full mx-auto text-center">
      <MaintenanceLink href="/signup">
        <Button
          size="xl"
          className="font-rubik-mono-one text-base sm:text-xl md:!text-2xl text-charcoal px-4 sm:px-6 md:px-10"
        >
          {variant === "primary" ? "Create a Profile" : "Sign Up Free"}
        </Button>
      </MaintenanceLink>
    </section>
  );
}

