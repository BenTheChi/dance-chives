"use client";

import { TVClient } from "./tv-client";
import { HideFooterOnMobile } from "./hide-footer";
import { AppNavbar } from "@/components/AppNavbar";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function TVPage() {
  const [initialSections, setInitialSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSize, setImageSize] = useState(250);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateSize = () => {
      setImageSize(window.innerWidth > 768 ? 420 : 250);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

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
          <div className="relative w-full tv-container-height">
            <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm pointer-events-auto flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Image
                  src="/mascot/Mascot3_Color_onDark.svg"
                  alt="Loading"
                  width={imageSize}
                  height={imageSize}
                  className="animate-rotate-medium"
                  priority
                />
                <p className="text-sm tracking-widest uppercase text-white">
                  Loading...
                </p>
              </div>
            </div>
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
