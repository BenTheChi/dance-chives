"use client";

import { X } from "lucide-react";

export interface ActiveFilterChip {
  /** Stable key, also used to identify which filter to clear. */
  id: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[];
  onClearAll: () => void;
}

/**
 * Shows what is currently narrowing the list, and lets each constraint be
 * removed individually. Without this, an applied filter is only visible by
 * opening the filter panel, which is what made the old layout feel opaque.
 */
export function ActiveFilterChips({
  chips,
  onClearAll,
}: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="w-full flex flex-wrap items-center gap-2 px-4 sm:px-0">
      <span className="text-sm font-bold text-muted-foreground">Filtering:</span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          aria-label={`Remove filter ${chip.label}`}
          className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-secondary-light text-charcoal text-sm font-bold hover:bg-secondary-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-light cursor-pointer"
        >
          {chip.label}
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-sm font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-light rounded-sm px-1 cursor-pointer"
      >
        Clear all
      </button>
    </div>
  );
}
