"use client";

import { useState, type ReactNode } from "react";
import { GapAffordance } from "./GapAffordance";
import { FactDisclosure, datePrecisionConfidence } from "./FactDisclosure";
import { CorrectionDialog } from "./CorrectionDialog";
import type { DatePrecision } from "@/lib/utils/event-gaps";

/**
 * One fact on an event page, in whichever of its four states applies.
 *
 * The states are the product of two questions — is the fact missing, and can
 * this viewer contribute — and they are deliberately different experiences:
 *
 *                  │ signed out              │ signed in
 *   ───────────────┼─────────────────────────┼──────────────────────────
 *   missing        │ "Add city" → sign-in    │ "Add city" → correction
 *   known/imprecise│ plain value             │ value + disclosure
 *
 * The bottom-left cell is the important one: a signed-out visitor reading a
 * complete-looking page gets nothing extra. Explaining how corrections work to
 * someone who cannot make one is an invitation to a door they cannot open, so
 * the whole teaching layer is gated on `canContribute`.
 *
 * A gap, by contrast, is shown to everyone — it is honest about the state of
 * the archive, and for a signed-out visitor it doubles as the reason to join.
 */

interface ContributableFactProps {
  eventId: string;
  kind: "city" | "date" | "styles";
  /** Whether the fact is missing (or, for dates, imprecise). */
  isGap: boolean;
  canContribute: boolean;
  /** Rendered when the fact is present. */
  children?: ReactNode;
  /** Label for the gap affordance, e.g. "Add city". */
  gapLabel: string;
  gapSize?: "sm" | "md";
  /** Dates only: drives the confidence line. */
  datePrecision?: DatePrecision;
  /** Styles only: seeds the multi-select. */
  currentStyles?: string[];
}

const ACTION_LABELS = {
  city: "Add the city",
  date: "Add the exact date",
  styles: "Add the styles",
} as const;

export function ContributableFact({
  eventId,
  kind,
  isGap,
  canContribute,
  children,
  gapLabel,
  gapSize = "sm",
  datePrecision,
  currentStyles = [],
}: ContributableFactProps) {
  const [openKind, setOpenKind] = useState<typeof kind | null>(null);

  const dialog = (
    <CorrectionDialog
      eventId={eventId}
      kind={openKind}
      onClose={() => setOpenKind(null)}
      currentStyles={currentStyles}
    />
  );

  if (isGap) {
    // Signed out: the affordance keeps its Phase 1 behaviour and points at
    // sign-in. Signed in: it opens the correction directly.
    if (!canContribute) {
      return <GapAffordance label={gapLabel} size={gapSize} />;
    }

    return (
      <>
        <GapAffordance
          label={gapLabel}
          size={gapSize}
          onActivate={() => setOpenKind(kind)}
        />
        {dialog}
      </>
    );
  }

  if (!canContribute) {
    return <>{children}</>;
  }

  return (
    <>
      <FactDisclosure
        canContribute
        confidence={
          kind === "date" && datePrecision
            ? datePrecisionConfidence(datePrecision)
            : undefined
        }
        actionLabel={ACTION_LABELS[kind]}
        onAction={() => setOpenKind(kind)}
      >
        {children}
      </FactDisclosure>
      {dialog}
    </>
  );
}
