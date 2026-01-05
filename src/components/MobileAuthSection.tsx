"use client";

import { Button } from "@/components/ui/button";
import { MaintenanceLink } from "@/components/MaintenanceLink";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function MobileAuthSection() {
  const { data: session } = useSession();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Only show on mobile when not logged in
  if (!isMobile || session) {
    return null;
  }

  return (
    <section className="w-full mx-auto text-center md:hidden bg-primary rounded-sm py-8 px-4 border-4 border-primary-light">
      <h2 className="mb-6 !text-3xl">Join Dance Chives</h2>
      <p className="mb-6 text-lg">
        Sign up or log in to save events, create your profile, and connect with
        the community.
      </p>
      <div className="flex flex-col gap-4 max-w-sm mx-auto">
        <MaintenanceLink href="/signup" className="w-full">
          <Button size="lg" className="w-full font-rubik-mono-one text-lg">
            Sign Up Free
          </Button>
        </MaintenanceLink>
        <MaintenanceLink href="/login" className="w-full">
          <Button
            size="lg"
            variant="secondary"
            className="w-full font-rubik-mono-one text-lg"
          >
            Login
          </Button>
        </MaintenanceLink>
      </div>
    </section>
  );
}

