"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { usePathname } from "next/navigation";

export function useCurrentUrl() {
  const pathname = usePathname();
  const [currentUrl, setCurrentUrl] = useState("");

  const updateUrl = useEffectEvent(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    setCurrentUrl(`${origin}${pathname}`);
  });

  useEffect(() => {
    updateUrl();
  }, [updateUrl, pathname]);

  return currentUrl;
}

