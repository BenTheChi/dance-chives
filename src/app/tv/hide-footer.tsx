"use client";

import { useEffect } from "react";

export function HideFooterOnMobile() {
  useEffect(() => {
    // Hide footer on mobile
    const footer = document.querySelector("footer");
    if (footer) {
      const mediaQuery = window.matchMedia("(max-width: 768px)");
      
      const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          footer.style.display = "none";
        } else {
          footer.style.display = "";
        }
      };

      // Set initial state
      handleMediaChange(mediaQuery);

      // Listen for changes
      mediaQuery.addEventListener("change", handleMediaChange);

      return () => {
        mediaQuery.removeEventListener("change", handleMediaChange);
        footer.style.display = "";
      };
    }
  }, []);

  return null;
}
