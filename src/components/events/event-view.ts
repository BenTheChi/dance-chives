import { TEventCard } from "@/types/event";
import {
  hasCityGap,
  hasDateGap,
  hasStyleGap,
} from "@/lib/utils/event-gaps";

/**
 * How the results are laid out.
 *
 * List is the default. The archive is 1,073 machine-built records and the
 * question a visitor actually has is "what is in here" — a table answers that
 * 50 rows at a time, where a grid of 330px cards answers it 6 at a time. The
 * grid is kept rather than deleted because it is still the better shape for a
 * short curated set, which is what the homepage and `/watch` show.
 */
export type EventView = "list" | "grid";

export const DEFAULT_EVENT_VIEW: EventView = "list";

/**
 * Whether this event is missing something a person could supply.
 *
 * Deliberately the union of the three gaps the affordances offer, so the
 * "Needs info" count and the amber buttons can never disagree: if the counter
 * claims an event needs info, opening it must show at least one thing to fill.
 */
export function needsInfo(event: TEventCard): boolean {
  return (
    hasCityGap(event.cityId, event.city) ||
    hasDateGap(event.datePrecision) ||
    hasStyleGap(event.styles)
  );
}
