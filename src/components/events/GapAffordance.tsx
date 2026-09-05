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
 * ## Two behaviours, one look
 *
 * Signed out, this is a link to sign-in — the Phase 1 behaviour, and still the
 * right one: the invitation is real, it just needs an account first. Signed in,
 * `onActivate` turns it into a button that opens the correction directly.
 *
 * Same styling either way on purpose. The affordance means "this could be
 * filled in"; whether that costs a sign-in first is not something the archive
 * should look different about.
 */

/** Gap amber, light and dark. Not in the app palette — see the note above. */
const GAP_CLASSES =
  "text-[#b4801f] dark:text-[#e0a942] border-[#b4801f]/60 dark:border-[#e0a942]/60 hover:bg-[#b4801f]/10 dark:hover:bg-[#e0a942]/10";

interface GapAffordanceProps {
  label: string;
  /** Where the invitation goes when the viewer cannot yet contribute. */
  href?: string;
  /**
   * Handle the invitation in place instead of navigating. Supplied for a
   * signed-in member, for whom the gap is directly fixable.
   */
  onActivate?: () => void;
  className?: string;
  size?: "sm" | "md";
}

export function GapAffordance({
  label,
  href = "/login",
  onActivate,
  className,
  size = "sm",
}: GapAffordanceProps) {
  const classes = cn(
    "inline-flex items-center gap-1 rounded-sm border border-dashed font-medium transition-colors whitespace-nowrap",
    size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2.5 py-1",
    GAP_CLASSES,
    className,
  );

  const icon = (
    <Plus aria-hidden="true" className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
  );

  if (onActivate) {
    return (
      <button
        type="button"
        onClick={(event) => {
          // The row itself is clickable in the table; without this a click on
          // the affordance would navigate to the event as well as opening the
          // correction.
          event.stopPropagation();
          event.preventDefault();
          onActivate();
        }}
        className={classes}
        title={label}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className={classes}
      title={`${label} — sign in to contribute`}
    >
      {icon}
      {label}
    </Link>
  );
}
