"use client";

import { TVClient } from "./tv-client";
import { HideFooterOnMobile } from "./hide-footer";
import { AppNavbar } from "@/components/AppNavbar";
import { useEffect, useState } from "react";

export default function TVPage() {
  const [initialSections, setInitialSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial sections on client side
    const fetchInitialSections = async () => {
      try {
        const response = await fetch("/api/tv/sections?offset=0&limit=10");
        if (response.ok) {
          const sections = await response.json();
          setInitialSections(sections);
        }
      } catch (error) {
        console.error("Error fetching initial sections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialSections();
  }, []);

  if (isLoading) {
    return (
      <>
        <HideFooterOnMobile />
        <div className="flex flex-col">
          <AppNavbar />
          <div className="relative w-full tv-container-height flex items-center justify-center">
            <div>Loading...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HideFooterOnMobile />
      <div className="flex flex-col">
        <AppNavbar />
        <div className="relative w-full tv-container-height">
          <TVClient initialSections={initialSections} />
        </div>
      </div>
    </>
  );
}
