"use client";

import { useEffect, useRef } from "react";

export function ParallaxBackground() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parallaxFactor = 0.25;

    const updateHeight = () => {
      if (parallaxRef.current) {
        // Calculate the maximum scroll distance
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;

        // Calculate extra height needed for parallax (background moves up by maxScroll * parallaxFactor)
        const extraHeight = maxScroll * parallaxFactor - 50;

        // Set height to cover full viewport plus parallax movement
        parallaxRef.current.style.height = `calc(110%)`;
      }
    };

    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrolled = window.pageYOffset;
        parallaxRef.current.style.transform = `translateY(${
          -scrolled * parallaxFactor
        }px)`;
      }
    };

    // Update height on mount and resize
    updateHeight();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateHeight, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return (
    <div
      ref={parallaxRef}
      className="absolute bottom-10 inset-0 z-0 pointer-events-none opacity-15"
      style={{
        backgroundImage: "url(/Pattern_Mascot_onDark.svg)",
        backgroundRepeat: "repeat",
        backgroundSize: "500px 500px",
        backgroundPosition: "0 0",
        willChange: "transform",
      }}
    />
  );
}
