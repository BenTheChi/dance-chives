"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReactAnimationItem {
  type: string;
  timestamp: number;
  id: string;
  x: number; // Random X position
  y?: number; // Random Y position (for pop animation)
}

interface ReactAnimationProps {
  reacts: Array<{ type: string; timestamp: number; id: string }>;
  currentTime: number;
  videoContainerRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  isPlaying: boolean;
  useLargeEmojis?: boolean;
  minYPercent?: number; // Minimum Y position as percentage (0-1)
  maxYPercent?: number; // Maximum Y position as percentage (0-1)
}

const REACT_EMOJIS: Record<string, string> = {
  fire: "🔥",
  clap: "👏",
  wow: "😮",
  laugh: "😂",
};

const TOLERANCE = 0.5; // ±0.5 seconds tolerance

export function ReactAnimation({
  reacts,
  currentTime,
  videoContainerRef,
  isPlaying,
  useLargeEmojis = false,
  minYPercent,
  maxYPercent,
}: ReactAnimationProps) {
  const [activeAnimations, setActiveAnimations] = useState<
    ReactAnimationItem[]
  >([]);
  // Track which reacts are currently within tolerance to avoid duplicate triggers
  // Key: react.id, Value: whether we're currently in the tolerance window
  const inToleranceWindowRef = useRef<Map<string, boolean>>(new Map());
  const lastCurrentTimeRef = useRef<number>(0);
  // Track which side the next animation should appear on (for equal distribution)
  const nextSideRef = useRef<"left" | "right">("left");

  // Generate random position for pop animation that avoids certain areas
  // - Avoid 10% on all edges (top, bottom, left, right)
  // - Avoid center 35% radius (17.5% on each side of center)
  // - Distributes equally between left and right sides
  // - If minYPercent/maxYPercent are provided, constrains Y to that range
  const getRandomPopPosition = (
    containerWidth: number,
    containerHeight: number,
    side: "left" | "right",
  ): { x: number; y: number } => {
    let x: number, y: number;

    // Determine Y range based on constraints or default behavior
    let minY: number, maxY: number;
    if (minYPercent !== undefined && maxYPercent !== undefined) {
      // Use provided constraints
      minY = containerHeight * minYPercent;
      maxY = containerHeight * maxYPercent;
      // Randomly choose top or bottom within the constrained range
      const range = maxY - minY;
      const topOrBottom = Math.random() < 0.5;
      if (topOrBottom) {
        // Top half of constrained range
        y = minY + range * (0.1 + Math.random() * 0.4); // 10% to 50% of range
      } else {
        // Bottom half of constrained range
        y = minY + range * (0.5 + Math.random() * 0.4); // 50% to 90% of range
      }
    } else {
      // Default behavior: Valid areas are in the corners
      // Left side: Top-left (X: 10-32.5%, Y: 10-25%) or Bottom-left (X: 10-32.5%, Y: 75-90%)
      // Right side: Top-right (X: 67.5-90%, Y: 10-25%) or Bottom-right (X: 67.5-90%, Y: 75-90%)
      const topOrBottom = Math.random() < 0.5; // Randomly choose top or bottom
      if (topOrBottom) {
        // Top corners
        y = containerHeight * (0.1 + Math.random() * 0.15); // 10% to 25%
      } else {
        // Bottom corners
        y = containerHeight * (0.75 + Math.random() * 0.15); // 75% to 90%
      }
    }

    // X position (same for both constrained and unconstrained)
    if (side === "left") {
      x = containerWidth * (0.1 + Math.random() * 0.225); // 10% to 32.5%
    } else {
      x = containerWidth * (0.675 + Math.random() * 0.225); // 67.5% to 90%
    }

    return { x, y };
  };

  // Track previous reacts to detect new additions
  const previousReactsRef = useRef<Set<string>>(new Set());

  // Check for reacts that should be triggered
  useEffect(() => {
    if (!videoContainerRef.current) {
      return;
    }

    // Check for newly added reacts even when paused (for immediate user feedback)
    const hasNewReacts = reacts.some(
      (r) => r.timestamp > 0 && !previousReactsRef.current.has(r.id),
    );

    if (!isPlaying && !hasNewReacts) {
      // Clear tolerance window tracking when paused (unless there are new reacts)
      inToleranceWindowRef.current.clear();
      return;
    }

    const container = videoContainerRef.current;
    const containerWidth = container.offsetWidth;

    // Determine if we're moving forward or backward
    lastCurrentTimeRef.current = currentTime;

    // Build set of current react IDs
    const currentReactIds = new Set(reacts.map((r) => r.id));

    // Find reacts within tolerance
    const newReacts: ReactAnimationItem[] = [];
    for (const react of reacts) {
      if (react.timestamp <= 0) continue;

      const timeDiff = Math.abs(react.timestamp - currentTime);
      const isInTolerance = timeDiff <= TOLERANCE;
      const wasInTolerance =
        inToleranceWindowRef.current.get(react.id) || false;
      const isNewReact = !previousReactsRef.current.has(react.id);

      // For newly added reacts, allow a larger tolerance window (2 seconds) to trigger immediately
      const isNewReactInRange = isNewReact && timeDiff <= 2.0;

      // Update tolerance window tracking
      // If a new react triggers immediately, mark it as having been in tolerance to prevent retriggering
      if (isNewReactInRange) {
        inToleranceWindowRef.current.set(react.id, true);
      } else {
        inToleranceWindowRef.current.set(react.id, isInTolerance);
      }

      // Trigger if:
      // 1. We're entering the tolerance window (allows retriggering when seeking)
      // 2. OR it's a newly added react within 2 seconds (immediate trigger for user's own reacts)
      if (
        (isInTolerance && (!wasInTolerance || isNewReact)) ||
        isNewReactInRange
      ) {
        // Generate unique ID with timestamp to allow multiple instances of same react
        const uniqueId = `${react.id}-${Date.now()}-${Math.random()}`;
        const containerHeight = container.offsetHeight;

        // Alternate between left and right sides for equal distribution
        const side = nextSideRef.current;
        nextSideRef.current = side === "left" ? "right" : "left";

        const position = getRandomPopPosition(
          containerWidth,
          containerHeight,
          side,
        );
        newReacts.push({
          ...react,
          id: uniqueId,
          x: position.x,
          y: position.y,
        });
      }
    }

    // Update previous reacts tracking
    previousReactsRef.current = currentReactIds;

    if (newReacts.length > 0) {
      setActiveAnimations((prev) => [...prev, ...newReacts]);
    }
  }, [currentTime, reacts, isPlaying, videoContainerRef]);

  // Remove animation after it completes
  const handleAnimationComplete = (id: string) => {
    const timeout = 3000; // 3s for pop animation
    setTimeout(() => {
      setActiveAnimations((prev) => prev.filter((item) => item.id !== id));
    }, timeout);
  };

  // Clear tolerance tracking when video changes
  useEffect(() => {
    // Reset when video container changes (new video loaded)
    inToleranceWindowRef.current.clear();
    previousReactsRef.current.clear();
    setActiveAnimations([]);
    lastCurrentTimeRef.current = 0;
    nextSideRef.current = "left"; // Reset side distribution
  }, [videoContainerRef.current]);

  if (!videoContainerRef.current) return null;

  const container = videoContainerRef.current;
  const containerHeight = container.offsetHeight;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      <AnimatePresence>
        {activeAnimations.map((item) => {
          const emoji = REACT_EMOJIS[item.type] || "😂";

          // Pop animation: quickly expand in, pause, then fade out
          // Position is pre-calculated to avoid center and side margins
          const y = item.y ?? containerHeight * 0.25; // Fallback if y not set
          return (
            <motion.div
              key={item.id}
              className="absolute will-change-transform"
              style={{
                left: `${item.x}px`,
                top: `${y}px`,
                transform: "translate3d(-50%, -50%, 0)", // Center on position
              }}
              initial={{
                opacity: 1,
                scale: 0.3,
              }}
              animate={{
                opacity: [1, 1, 1, 0],
                scale: [0.3, 1.2, 1.2, 1.0],
              }}
              exit={{
                opacity: 0,
                scale: 1.0,
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                opacity: {
                  times: [0, 0.15, 0.7, 1], // Hold at full opacity, then fade out
                  duration: 2.5,
                },
                scale: {
                  times: [0, 0.15, 0.7, 1], // Quick expand, hold, slight shrink
                  duration: 1.5,
                },
              }}
              onAnimationComplete={() => handleAnimationComplete(item.id)}
            >
              <span
                className={
                  useLargeEmojis
                    ? "!text-5xl select-none"
                    : "text-3xl select-none"
                }
                style={{ willChange: "transform" }}
              >
                {emoji}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
