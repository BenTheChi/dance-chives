"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { PageSkeleton } from "./PageSkeleton";

export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const minLoadingTimeRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathnameRef.current = pathname;
      return;
    }

    // If pathname changed, show loading skeleton
    if (prevPathnameRef.current !== pathname) {
      // Clear any existing timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }

      setIsLoading(true);
      prevPathnameRef.current = pathname;

      // Ensure skeleton shows for at least 200ms to avoid flash
      const startTime = Date.now();
      const minDisplayTime = 200;

      minLoadingTimeRef.current = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDisplayTime - elapsed);

        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, remaining);
      }, minDisplayTime);

      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        if (minLoadingTimeRef.current) {
          clearTimeout(minLoadingTimeRef.current);
        }
      };
    }
  }, [pathname]);

  // Show skeleton during navigation
  if (isLoading) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
}
