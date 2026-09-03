/**
 * Which facts an event is missing.
 *
 * These are pure predicates, deliberately in their own module rather than
 * beside the components that render them: the event page is a server component
 * and `GapAffordance` is a client one, and a plain function exported from a
 * `"use client"` module cannot be called on the server — it is only callable as
 * a component or passed as a prop. Keeping the logic here lets both sides use
 * exactly the same rules.
 */

export type DatePrecision = "day" | "month" | "year";

/**
 * Whether an event's location is genuinely unknown.
 *
 * Two sentinel cities stand in for a real one, and they are NOT equivalent:
 *
 *  - `unknown` (236 events) backs a country-only event — the country is known
 *    but the city never was. That is a gap, and someone who watched the
 *    footage may well recognise the venue.
 *  - `online` (1 event) backs a remote event. That is a complete, correct
 *    answer; there is no city to add, and asking for one would be wrong.
 *
 * Plus 12 events with no city at all. 236 + 12 = the 248 the gap counter
 * reports.
 */
export function hasCityGap(
  cityId?: string | null,
  city?: string | null,
): boolean {
  if (cityId?.toLowerCase() === "online") return false;
  if (!city || city.trim() === "") return true;
  return cityId?.toLowerCase() === "unknown";
}

/** A date known only to the month or the year. 758 events today. */
export function hasDateGap(precision?: DatePrecision | null): boolean {
  return (precision ?? "day") !== "day";
}

/** No styles extracted. 98 events today. */
export function hasStyleGap(styles?: string[] | null): boolean {
  return (styles?.length ?? 0) === 0;
}
