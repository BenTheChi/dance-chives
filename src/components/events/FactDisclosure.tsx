"use client";

import { useState, type ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * The teaching layer over a single fact.
 *
 * ## Why this exists instead of a tooltip on the button
 *
 * The surprising thing about this archive is not what the buttons do — it is
 * that almost every fact on the page was extracted by a machine from a YouTube
 * channel, and that a signed-in member may simply correct it. A tooltip hung
 * off an "Edit" button teaches that only to someone who already found the
 * button. Hanging it off the *fact* teaches it to anyone who reads the page.
 *
 * ## What it says, and what it deliberately does not
 *
 * Two things only: how certain the value is, and what happens if you change it.
 *
 * Provenance ("imported from YouTube") and attribution ("last changed by …")
 * were considered and cut. Provenance is the same sentence on ~every event, so
 * it becomes wallpaper; attribution is empty until corrections accumulate. Both
 * would dilute the two lines that actually change behaviour: *your knowledge is
 * better than ours here*, and *this is safe to touch*.
 *
 * ## Signed-out users get none of this
 *
 * A visitor who cannot act is not helped by learning how acting works — it is
 * an invitation to a door they cannot open. They keep the plain value and, on a
 * gap, the same quiet "sign in to contribute" affordance as before. The whole
 * disclosure layer is gated on `canContribute`.
 *
 * ## Why a popover rather than a tooltip
 *
 * Hover tooltips never fire on touch. This content is the explanation, not a
 * label, so it opens on hover on pointer devices AND on tap/keyboard
 * everywhere — a `Popover` driven by both, rather than a `Tooltip`.
 */

export interface FactDisclosureProps {
  /** The rendered fact — shown whether or not the user can contribute. */
  children: ReactNode;
  /**
   * How certain this value is, in the member's terms ("Year only — the exact
   * date isn't known"). Omitted when the value is fully known.
   */
  confidence?: string;
  /** Label for the action, e.g. "Add the exact date". */
  actionLabel: string;
  /** What the action opens. */
  onAction: () => void;
  /**
   * False for signed-out visitors: the whole disclosure collapses to plain
   * content and no interaction is offered.
   */
  canContribute: boolean;
  /** Visually marks the fact as hoverable without shouting. */
  className?: string;
}

/**
 * The one line that removes the fear of touching a live archive. Identical for
 * every field on purpose: it is a property of how contributions work, not of
 * the field, and repeating it verbatim is what makes it learnable.
 */
const CONSEQUENCE = "Applies right away. Recorded under your name, and a moderator can undo it.";

export function FactDisclosure({
  children,
  confidence,
  actionLabel,
  onAction,
  canContribute,
  className,
}: FactDisclosureProps) {
  const [open, setOpen] = useState(false);

  if (!canContribute) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Hover opens it on pointer devices; the button itself keeps tap and
          // keyboard working where hover does not exist.
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm text-left",
            "underline decoration-dotted decoration-secondary-light/50 underline-offset-4",
            "hover:decoration-secondary-light focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-secondary-light",
            className,
          )}
        >
          {children}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-72 space-y-3 text-sm"
        // Keep it open while the pointer is inside, so the action is clickable.
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {confidence ? (
          <p className="font-medium leading-snug">{confidence}</p>
        ) : null}

        <p className="text-muted-foreground leading-snug">{CONSEQUENCE}</p>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onAction();
          }}
          className="w-full rounded-sm border-2 border-secondary-light px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary-light/20"
        >
          {actionLabel}
        </button>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The member-facing description of how precise a date is.
 *
 * Phrased as what is *missing* rather than what is known, because the point is
 * to show the member where their knowledge beats ours.
 */
export function datePrecisionConfidence(
  precision: "day" | "month" | "year",
): string | undefined {
  switch (precision) {
    case "year":
      return "We only know the year — the exact day isn't recorded.";
    case "month":
      return "We only know the month — the exact day isn't recorded.";
    default:
      return undefined;
  }
}
