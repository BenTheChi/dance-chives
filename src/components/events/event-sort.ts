import { TEventCard } from "@/types/event";

/** Fields the events list can be ordered by. Order here drives the picker. */
export const EVENT_SORT_FIELDS = [
  "date",
  "title",
  "eventType",
  "city",
] as const;

export type EventSortField = (typeof EVENT_SORT_FIELDS)[number];
export type EventSortDirection = "asc" | "desc";

export interface EventSortState {
  field: EventSortField;
  direction: EventSortDirection;
}

/**
 * Date descending is the server's own ordering — "soonest first" for future
 * events, "most recent first" for past ones. Both read as closest-to-today,
 * so this is the neutral default for either list.
 */
export const DEFAULT_EVENT_SORT: EventSortState = {
  field: "date",
  direction: "desc",
};

const FIELD_LABELS: Record<EventSortField, string> = {
  date: "Date",
  title: "Title",
  eventType: "Type",
  city: "City",
};

export function sortFieldLabel(field: EventSortField): string {
  return FIELD_LABELS[field];
}

/**
 * Direction labels are field-specific: "Newest first" means nothing for a
 * title, and "A–Z" means nothing for a date.
 */
const DIRECTION_LABELS: Record<
  EventSortField,
  Record<EventSortDirection, string>
> = {
  date: { desc: "Closest first", asc: "Furthest first" },
  title: { asc: "A–Z", desc: "Z–A" },
  eventType: { asc: "A–Z", desc: "Z–A" },
  city: { asc: "A–Z", desc: "Z–A" },
};

export function directionLabelsFor(
  field: EventSortField
): Record<EventSortDirection, string> {
  return DIRECTION_LABELS[field];
}

/**
 * Sorts a list that is already in the server's closest-to-today order.
 *
 * Date is therefore a pass-through (or a straight reverse), and the other
 * fields fall back to that incoming order to break ties, which keeps events
 * sharing a title/type/city in chronological order.
 */
export function sortEvents(
  events: TEventCard[],
  sort: EventSortState
): TEventCard[] {
  if (sort.field === "date") {
    return sort.direction === "desc" ? events : [...events].reverse();
  }

  const collator = new Intl.Collator(undefined, {
    sensitivity: "base",
    numeric: true,
  });

  const valueFor = (event: TEventCard): string => {
    switch (sort.field) {
      case "title":
        return event.title || "";
      case "eventType":
        return event.eventType || "";
      case "city":
        return event.city || "";
      default:
        return "";
    }
  };

  const multiplier = sort.direction === "asc" ? 1 : -1;

  return [...events]
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const valueA = valueFor(a.event);
      const valueB = valueFor(b.event);

      // Blanks sort last in both directions rather than clumping at whichever
      // end the collator happens to place the empty string.
      if (!valueA && !valueB) return a.index - b.index;
      if (!valueA) return 1;
      if (!valueB) return -1;

      const comparison = collator.compare(valueA, valueB);
      if (comparison !== 0) return comparison * multiplier;

      return a.index - b.index;
    })
    .map(({ event }) => event);
}
