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

const NAVIGATION_LOADING_MESSAGES = [
  "Loading...",
  "Any second now",
  "Any several seconds now",
  "Might be a good time for a little dance break",
  "We apologize for the delay. We promise it won't be much longer",
  "This is awkward. Um... how was your day?",
];

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
  const [shouldShowOverlay, setShouldShowOverlay] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [imageSize, setImageSize] = useState(250);
  const [loadingText, setLoadingText] = useState("Loading...");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animateDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingMessageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const submissionCountRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    submissionCountRef.current = submissionCount;
  }, [submissionCount]);

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

  // Intercept Link clicks to show overlay with delay
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
            setLoadingText(NAVIGATION_LOADING_MESSAGES[0]);
            setLoadingMessageIndex(0);
            setShouldAnimate(false);

            // Clear any existing delays
            if (showDelayTimeoutRef.current) {
              clearTimeout(showDelayTimeoutRef.current);
            }
            if (animateDelayTimeoutRef.current) {
              clearTimeout(animateDelayTimeoutRef.current);
            }

            // Show overlay after 100ms delay
            showDelayTimeoutRef.current = setTimeout(() => {
              setShouldShowOverlay(true);
              // Start animation after another 100ms (200ms total from click)
              animateDelayTimeoutRef.current = setTimeout(() => {
                setShouldAnimate(true);
              }, 100);
            }, 100);
          }
        }
      }
    };

    // Use capture phase to catch clicks early
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
      if (showDelayTimeoutRef.current) {
        clearTimeout(showDelayTimeoutRef.current);
      }
      if (animateDelayTimeoutRef.current) {
        clearTimeout(animateDelayTimeoutRef.current);
      }
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
      // Pathname changed - navigation completed
      // Use ref to get submissionCount at the moment of pathname change (before state updates)
      const hadActiveSubmission = submissionCountRef.current > 0;
      prevPath.current = pathname;

      // Clear any pending delays
      if (showDelayTimeoutRef.current) {
        clearTimeout(showDelayTimeoutRef.current);
      }
      if (animateDelayTimeoutRef.current) {
        clearTimeout(animateDelayTimeoutRef.current);
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (loadingMessageIntervalRef.current) {
        clearInterval(loadingMessageIntervalRef.current);
        loadingMessageIntervalRef.current = null;
      }

      // If navigation was triggered by form submission, ensure navigation state is set
      // and clear submission count immediately
      if (hadActiveSubmission) {
        setSubmissionCount(0);
        setIsNavigating(true);
        setShouldShowOverlay(true);
        setLoadingText(NAVIGATION_LOADING_MESSAGES[0]);
        setLoadingMessageIndex(0);
        // Keep animation going during transition
        setShouldAnimate(true);
      }

      // Hide overlay after navigation completes
      // Use a longer delay to ensure the new page is fully rendered
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        setShouldShowOverlay(false);
        setShouldAnimate(false);
        // Clear loading message interval
        if (loadingMessageIntervalRef.current) {
          clearInterval(loadingMessageIntervalRef.current);
          loadingMessageIntervalRef.current = null;
        }
        setLoadingMessageIndex(0);
      }, 300);
    }

    return () => {
      // Only clear timeout if pathname is actually changing (not just re-render)
      // This prevents clearing the timeout when submissionCount changes
      if (navigationTimeoutRef.current && prevPath.current !== pathname) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [pathname]); // Removed submissionCount from dependencies - it causes effect to re-run and clear timeout

  // When route changes, clear any pending submissions so the overlay
  // doesn't linger after navigation.
  useEffect(() => {
    if (prevPath.current !== null && prevPath.current !== pathname) {
      // Clear submission count when navigation starts
      // (This is handled in the navigation completion effect above, but keeping for safety)
      if (submissionCount > 0) {
        setSubmissionCount(0);
      }
    }
  }, [pathname, submissionCount]);

  // Show overlay if either navigating or submitting
  // For navigation, only show if the delay has passed
  const isActive = (isNavigating && shouldShowOverlay) || submissionCount > 0;

  // Update loading text based on state
  useEffect(() => {
    if (submissionCount > 0) {
      setLoadingText("Submitting...");
      // Clear loading message interval when form submission starts
      if (loadingMessageIntervalRef.current) {
        clearInterval(loadingMessageIntervalRef.current);
        loadingMessageIntervalRef.current = null;
      }
    } else if (isNavigating) {
      // Don't set text here - it's managed by the rotating messages effect
    }
  }, [submissionCount, isNavigating]);

  // Rotate through humorous loading messages during navigation
  useEffect(() => {
    if (isNavigating && shouldShowOverlay && submissionCount === 0) {
      // Start with first message
      setLoadingText(NAVIGATION_LOADING_MESSAGES[0]);
      setLoadingMessageIndex(0);

      // Rotate messages every 4 seconds
      loadingMessageIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => {
          const nextIndex =
            (prevIndex + 1) % NAVIGATION_LOADING_MESSAGES.length;
          setLoadingText(NAVIGATION_LOADING_MESSAGES[nextIndex]);
          return nextIndex;
        });
      }, 4000);

      return () => {
        if (loadingMessageIntervalRef.current) {
          clearInterval(loadingMessageIntervalRef.current);
          loadingMessageIntervalRef.current = null;
        }
      };
    } else {
      // Clear interval when not navigating or when form submission is active
      if (loadingMessageIntervalRef.current) {
        clearInterval(loadingMessageIntervalRef.current);
        loadingMessageIntervalRef.current = null;
      }
    }
  }, [isNavigating, shouldShowOverlay, submissionCount]);

  // Handle form submission animation delay
  useEffect(() => {
    if (submissionCount > 0) {
      // Show immediately for form submissions, but delay animation
      setShouldAnimate(false);
      if (animateDelayTimeoutRef.current) {
        clearTimeout(animateDelayTimeoutRef.current);
      }
      animateDelayTimeoutRef.current = setTimeout(() => {
        setShouldAnimate(true);
      }, 100);
    } else {
      // Only reset animation when submissions complete AND not navigating
      // If we're navigating, keep the animation state as-is (it will be managed by navigation timeout)
      if (!isNavigating) {
        setShouldAnimate(false);
        if (animateDelayTimeoutRef.current) {
          clearTimeout(animateDelayTimeoutRef.current);
        }
      }
    }

    return () => {
      if (animateDelayTimeoutRef.current) {
        clearTimeout(animateDelayTimeoutRef.current);
      }
    };
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
              className={shouldAnimate ? "animate-rotate-medium" : ""}
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
