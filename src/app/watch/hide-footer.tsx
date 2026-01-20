"use client";

import { useEffect } from "react";

export function HideFooterOnMobile() {
  useEffect(() => {
    // Hide footer on mobile and in landscape using Tailwind classes
    const footer = document.querySelector("footer");
    if (footer) {
      // Add Tailwind classes: hidden on mobile (default), visible on md and up, but hidden in landscape
      footer.classList.add("hidden", "md:block", "landscape:hidden");

      return () => {
        // Cleanup: remove the classes when component unmounts
        footer.classList.remove("hidden", "md:block", "landscape:hidden");
      };
    }
  }, []);

  return null;
}
