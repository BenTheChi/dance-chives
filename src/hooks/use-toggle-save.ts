"use client";

import { useState, useTransition } from "react";
import { toggleSaveEvent } from "@/lib/server_actions/event_actions";

export function useToggleSave(
  initialSaved: boolean,
  eventId: string
): {
  isSaved: boolean;
  toggle: () => Promise<void>;
  isPending: boolean;
} {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const toggle = async () => {
    // Optimistic update
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);

    startTransition(async () => {
      try {
        const result = await toggleSaveEvent(eventId);
        if (result.status === 200 && "saved" in result) {
          // Sync with server response
          setIsSaved(result.saved);
        } else {
          // Revert on error
          setIsSaved(previousSaved);
        }
      } catch (error) {
        // Revert on error
        setIsSaved(previousSaved);
        console.error("Error toggling save:", error);
      }
    });
  };

  return { isSaved, toggle, isPending };
}

