"use client";

import { Section } from "@/types/event";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import VideoGallery from "./VideoGallery";
import { cn } from "@/lib/utils";

export default function SectionBracketTabSelector({
  section,
  eventTitle,
  eventId,
}: {
  section: Section;
  eventTitle: string;
  eventId: string;
}) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [activeBracket, setActiveBracket] = useState(
    section?.brackets[0]?.id || ""
  );
  const [isSticky, setIsSticky] = useState(false);
  const bracketRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tabBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingToRef = useRef(false);

  // Navbar height (h-14 = 56px)
  const NAVBAR_HEIGHT = 56;
  // Tab bar height
  const TAB_BAR_HEIGHT = 48;
  // Total offset for scroll calculations
  const SCROLL_OFFSET = NAVBAR_HEIGHT + TAB_BAR_HEIGHT + 16;

  useEffect(() => {
    if (section?.brackets.length > 0) {
      setActiveBracket(section?.brackets[0]?.id || "");
    }
  }, [section]);

  // Scroll spy - detect which bracket is in view
  const handleScroll = useCallback(() => {
    if (isScrollingToRef.current) return;

    const brackets = section?.brackets || [];
    if (brackets.length === 0) return;

    // Check sticky state
    if (tabBarRef.current) {
      const tabBarTop = tabBarRef.current.getBoundingClientRect().top;
      setIsSticky(tabBarTop <= NAVBAR_HEIGHT);
    }

    // Find the bracket that's most in view
    let currentBracket = brackets[0]?.id || "";

    for (const bracket of brackets) {
      const element = bracketRefs.current.get(bracket.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        // If the top of the bracket section is above or at the scroll offset threshold
        if (rect.top <= SCROLL_OFFSET + 100) {
          currentBracket = bracket.id;
        }
      }
    }

    if (currentBracket !== activeBracket) {
      setActiveBracket(currentBracket);
    }
  }, [section?.brackets, activeBracket, NAVBAR_HEIGHT, SCROLL_OFFSET]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Click to scroll to bracket
  const scrollToBracket = (bracketId: string) => {
    const element = bracketRefs.current.get(bracketId);
    if (element) {
      isScrollingToRef.current = true;
      setActiveBracket(bracketId);

      const elementTop = element.getBoundingClientRect().top + window.scrollY;
      const scrollTo = elementTop - SCROLL_OFFSET;

      window.scrollTo({
        top: scrollTo,
        behavior: "smooth",
      });

      // Reset the scrolling flag after animation completes
      setTimeout(() => {
        isScrollingToRef.current = false;
      }, 500);
    }
  };

  // Set ref for each bracket section
  const setBracketRef = (bracketId: string, element: HTMLDivElement | null) => {
    if (element) {
      bracketRefs.current.set(bracketId, element);
    } else {
      bracketRefs.current.delete(bracketId);
    }
  };

  // Render section without brackets
  if (!section?.hasBrackets && section?.videos.length > 0) {
    return (
      <div className="w-full p-2 sm:p-4 lg:px-6 border-2 border-secondary-light rounded-sm bg-secondary-dark">
        <VideoGallery
          videos={section?.videos}
          eventLink={`/events/${eventId}`}
          eventTitle={eventTitle}
          eventId={eventId}
          sectionTitle={section?.title}
          sectionSlug={section?.id}
          sectionStyles={section?.styles}
          applyStylesToVideos={section?.applyStylesToVideos}
          currentUserId={currentUserId}
        />
      </div>
    );
  }

  if (section?.brackets.length > 0) {
    // Render section with brackets - scroll-spy navigation
    return (
      <div className="w-full" ref={containerRef}>
        {/* Sticky Tab Bar - Mobile only */}
        <div
          ref={tabBarRef}
          className={cn(
            "bg-background/95 backdrop-blur-sm z-40 transition-shadow duration-200",
            "sticky top-14", // Stick under navbar (h-14 = 56px = top-14)
            "sm:hidden", // Only show on mobile
            isSticky && "shadow-md border-b"
          )}
        >
          <div className="flex flex-row gap-2 py-2 px-1 overflow-x-auto scrollbar-hide">
            {section?.brackets.map((bracket) => (
              <button
                key={bracket.id}
                onClick={() => scrollToBracket(bracket.id)}
                className={cn(
                  "px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-all duration-200",
                  "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeBracket === bracket.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {bracket.title}
              </button>
            ))}
          </div>
        </div>

        {/* All Bracket Sections */}
        <div className="flex flex-col gap-12 mt-6">
          {section?.brackets.map((bracket) => (
            <div
              key={bracket.id}
              ref={(el) => setBracketRef(bracket.id, el)}
              className="scroll-mt-32" // Offset for sticky header
            >
              {/* Video Gallery for this bracket */}
              <div className="p-2 sm:p-4 lg:px-6 border-2 border-secondary-light rounded-sm bg-secondary-dark">
                <h2 className="!font-extrabold mb-4 text-center">
                  {bracket.title.toUpperCase()}
                </h2>
                <VideoGallery
                  videos={bracket.videos}
                  eventLink={`/events/${eventId}`}
                  eventTitle={eventTitle}
                  eventId={eventId}
                  sectionTitle={section?.title}
                  sectionSlug={section?.id}
                  bracketTitle={bracket.title}
                  sectionStyles={section?.styles}
                  applyStylesToVideos={section?.applyStylesToVideos}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
