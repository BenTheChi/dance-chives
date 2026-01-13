"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

const OVERLAY_IMAGE = "/mascot/Mascot3_Color_onDark.svg";

type LoadingOverlayContextValue = {
  isActive: boolean;
  startSubmission: () => void;
  endSubmission: () => void;
};

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(
  null
);

export function SubmissionOverlayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [submissionCount, setSubmissionCount] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [imageSize, setImageSize] = useState(250);
  const [loadingText, setLoadingText] = useState("Loading...");
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Intercept Link clicks to show overlay immediately
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is on a Link or inside a Link
      const link = target.closest("a[href]");
      if (link) {
        const href = link.getAttribute("href");
        // Only show for internal navigation (not external links, mailto, etc.)
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          // Check if this is actually a different route
          const currentPath = window.location.pathname;
          if (href !== currentPath) {
            setIsNavigating(true);
            setLoadingText("Loading...");

            // Set a timeout to hide if navigation doesn't actually happen
            // (e.g., same page link, prevented navigation, etc.)
            if (navigationTimeoutRef.current) {
              clearTimeout(navigationTimeoutRef.current);
            }
            navigationTimeoutRef.current = setTimeout(() => {
              // Only hide if pathname hasn't changed (navigation didn't occur)
              if (window.location.pathname === currentPath) {
                setIsNavigating(false);
              }
            }, 300);
          }
        }
      }
    };

    // Use capture phase to catch clicks early
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, []);

  // Detect navigation completion by watching pathname changes
  useEffect(() => {
    if (prevPath.current === null) {
      // Initial load, don't show navigation overlay
      prevPath.current = pathname;
      return;
    }

    if (prevPath.current !== pathname) {
      // Pathname changed - navigation is in progress
      // Keep overlay visible (it was already shown on click)
      prevPath.current = pathname;

      // Clear any pending navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      // Hide overlay after navigation completes (page has loaded)
      // Use a small delay to ensure the new page is rendered
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, 100);
    }

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [pathname]);

  // When route changes, clear any pending submissions so the overlay
  // doesn't linger after navigation.
  useEffect(() => {
    if (prevPath.current !== null && prevPath.current !== pathname) {
      setSubmissionCount(0);
    }
  }, [pathname]);

  // Show overlay if either navigating or submitting
  const isActive = isNavigating || submissionCount > 0;

  // Update loading text based on state
  useEffect(() => {
    if (submissionCount > 0) {
      setLoadingText("Submitting...");
    } else if (isNavigating) {
      setLoadingText("Loading...");
    }
  }, [submissionCount, isNavigating]);

  const value = useMemo(
    () => ({
      isActive,
      startSubmission: () => {
        setSubmissionCount((count) => count + 1);
        setLoadingText("Submitting...");
      },
      endSubmission: () => {
        setSubmissionCount((count) => Math.max(0, count - 1));
        if (submissionCount <= 1) {
          setLoadingText("Loading...");
        }
      },
    }),
    [isActive, submissionCount]
  );

  return (
    <LoadingOverlayContext.Provider value={value}>
      {children}
      {isActive && (
        <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm pointer-events-auto flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Image
              src={OVERLAY_IMAGE}
              alt={loadingText}
              width={imageSize}
              height={imageSize}
              className="animate-rotate-medium"
              priority
            />
            <p className="text-sm tracking-widest uppercase text-white">
              {loadingText}
            </p>
          </div>
        </div>
      )}
    </LoadingOverlayContext.Provider>
  );
}

export function useSubmissionOverlay() {
  const context = useContext(LoadingOverlayContext);

  if (!context) {
    throw new Error(
      "useSubmissionOverlay must be used within a SubmissionOverlayProvider"
    );
  }

  return context;
}
