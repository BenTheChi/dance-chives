"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Fields the events list can be ordered by. */
export type EventSortField = "date" | "title" | "eventType" | "city";
export type EventSortDirection = "asc" | "desc";

export interface EventSortState {
  field: EventSortField;
  direction: EventSortDirection;
}

/**
 * Date defaults to the server-side ordering, which is "soonest first" for
 * future events and "most recent first" for past ones. Both read as "closest
 * to today first", so `desc` is the neutral default for either list.
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

/**
 * Direction labels are field-specific: "Newest first" is meaningless for a
 * title, and "A–Z" is meaningless for a date.
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

interface EventSortProps {
  sort: EventSortState;
  onSortChange: (sort: EventSortState) => void;
}

export function EventSort({ sort, onSortChange }: EventSortProps) {
  const directionLabels = DIRECTION_LABELS[sort.field];

  return (
    <div className="flex flex-col w-full bg-secondary sm:rounded-sm border-t-0 border-b-4 border-l-4 border-r-4 sm:border-t-4 border-secondary-light max-w-[550px] mx-auto">
      <div className="p-2">
        <span className="block !font-bold !text-xl text-white text-center w-full">
          Sort
        </span>
      </div>
      <div className="px-4 pb-4">
        <div className="grid gap-4 grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Field</label>
            <Select
              value={sort.field}
              onValueChange={(value) =>
                onSortChange({
                  ...sort,
                  field: value as EventSortField,
                })
              }
            >
              <SelectTrigger className="w-full min-w-0" aria-label="Sort field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(FIELD_LABELS) as EventSortField[]
                ).map((field) => (
                  <SelectItem key={field} value={field}>
                    {FIELD_LABELS[field]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Order</label>
            <Select
              value={sort.direction}
              onValueChange={(value) =>
                onSortChange({
                  ...sort,
                  direction: value as EventSortDirection,
                })
              }
            >
              <SelectTrigger className="w-full min-w-0" aria-label="Sort order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{directionLabels.desc}</SelectItem>
                <SelectItem value="asc">{directionLabels.asc}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
