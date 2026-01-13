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

type SubmissionOverlayContextValue = {
  isActive: boolean;
  startSubmission: () => void;
  endSubmission: () => void;
};

const SubmissionOverlayContext =
  createContext<SubmissionOverlayContextValue | null>(null);

export function SubmissionOverlayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeCount, setActiveCount] = useState(0);
  const [imageSize, setImageSize] = useState(250);
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

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

  // When the route changes, clear any pending submissions so the overlay
  // doesn't linger after navigation.
  useEffect(() => {
    if (prevPath.current !== null && prevPath.current !== pathname) {
      setActiveCount(0);
    }
    prevPath.current = pathname;
  }, [pathname]);

  const value = useMemo(
    () => ({
      isActive: activeCount > 0,
      startSubmission: () => setActiveCount((count) => count + 1),
      endSubmission: () => setActiveCount((count) => Math.max(0, count - 1)),
    }),
    [activeCount]
  );

  return (
    <SubmissionOverlayContext.Provider value={value}>
      {children}
      {value.isActive && (
        <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm pointer-events-auto flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Image
              src={OVERLAY_IMAGE}
              alt="Submitting"
              width={imageSize}
              height={imageSize}
              className="animate-rotate-medium"
              priority
            />
            <p className="text-sm tracking-widest uppercase text-white">
              Submitting...
            </p>
          </div>
        </div>
      )}
    </SubmissionOverlayContext.Provider>
  );
}

export function useSubmissionOverlay() {
  const context = useContext(SubmissionOverlayContext);

  if (!context) {
    throw new Error(
      "useSubmissionOverlay must be used within a SubmissionOverlayProvider"
    );
  }

  return context;
}
