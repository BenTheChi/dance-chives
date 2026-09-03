"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A missing or imprecise field, rendered as an invitation rather than a blank.
 *
 * ## Why these are not errors
 *
 * 249 events have no city and 758 know only their month or year. That is the
 * honest output of machine extraction from YouTube, not breakage — so the
 * styling deliberately avoids red. A dashed outline reads as "something could
 * go here"; a red one would claim the archive is broken.
 *
 * ## Why amber
 *
 * Green already means brand and lilac already means dance style, so a gap
 * needs its own semantic slot that neither collides with nor competes against
 * them. The amber below is deliberately outside the app palette for that
 * reason.
 *
 * ## Phase 1 is inert
 *
 * These link to sign-in rather than writing anything. Placing the affordances
 * before the write path exists means Phase 2 is purely backend: the UI hooks
 * are already in the right places, and wiring them is a change of `href` to a
 * server action rather than a redesign.
 */

/** Gap amber, light and dark. Not in the app palette — see the note above. */
const GAP_CLASSES =
  "text-[#b4801f] dark:text-[#e0a942] border-[#b4801f]/60 dark:border-[#e0a942]/60 hover:bg-[#b4801f]/10 dark:hover:bg-[#e0a942]/10";

interface GapAffordanceProps {
  label: string;
  /** Where the invitation goes. Phase 1 sends everything to sign-in. */
  href?: string;
  className?: string;
  size?: "sm" | "md";
}

export function GapAffordance({
  label,
  href = "/login",
  className,
  size = "sm",
}: GapAffordanceProps) {
  return (
    <Link
      href={href}
      // The row itself is clickable in the table; without this a click on the
      // affordance would navigate to the event instead of the sign-in.
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-dashed font-medium transition-colors whitespace-nowrap",
        size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2.5 py-1",
        GAP_CLASSES,
        className,
      )}
      title={`${label} — sign in to contribute`}
    >
      <Plus aria-hidden="true" className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {label}
    </Link>
  );
}
