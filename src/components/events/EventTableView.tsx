"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEventCard } from "@/types/event";
import { formatEventDate } from "@/lib/utils/date-display";
import {
  defaultDirectionFor,
  directionLabelsFor,
  type EventSortField,
  type EventSortState,
} from "./event-sort";

const TITLE_CHAR_LIMIT = 48;

interface EventTableViewProps {
  events: TEventCard[];
  className?: string;
  sort?: EventSortState;
  onSortChange?: (sort: EventSortState) => void;
}

/** Columns in render order. `field` omitted for columns that cannot sort. */
const COLUMNS: Array<{
  label: string;
  width: string;
  field?: EventSortField;
}> = [
  { label: "Date", width: "w-[120px]", field: "date" },
  { label: "Title", width: "w-[300px]", field: "title" },
  { label: "Type", width: "w-[130px]", field: "eventType" },
  { label: "Styles", width: "w-[250px]" },
  { label: "City", width: "w-[170px]", field: "city" },
];

function clampTitle(title: string): string {
  if (title.length <= TITLE_CHAR_LIMIT) return title;
  return `${title.slice(0, TITLE_CHAR_LIMIT).trimEnd()}...`;
}

function formatDate(value: string, precision?: TEventCard["datePrecision"]): string {
  return formatEventDate(value, precision) || "-";
}

export function EventTableView({
  events,
  className,
  sort,
  onSortChange,
}: EventTableViewProps) {
  const router = useRouter();
  const cellClassName = "px-4 py-3 text-sm font-medium";
  const sortable = Boolean(sort && onSortChange);

  const handleNavigate = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  // Clicking the active column flips direction; a new column starts at its
  // default — A–Z for text columns, newest first for dates.
  const handleHeaderClick = (field: EventSortField) => {
    if (!sort || !onSortChange) return;

    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
      return;
    }

    onSortChange({ field, direction: defaultDirectionFor(field) });
  };

  return (
    <div
      className={cn(
        "w-full max-w-[1200px] mx-auto bg-primary-dark sm:rounded-sm border-4 border-primary-light overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed">
          <thead className="bg-primary-light text-charcoal">
            <tr>
              {COLUMNS.map((column) => {
                const isActive = sort?.field === column.field;
                const canSort = sortable && column.field !== undefined;

                if (!canSort) {
                  return (
                    <th
                      key={column.label}
                      className={cn(
                        "px-4 py-3 text-left text-sm font-bold",
                        column.width
                      )}
                    >
                      {column.label}
                    </th>
                  );
                }

                const field = column.field as EventSortField;
                const labels = directionLabelsFor(field);
                const nextLabel = isActive
                  ? labels[sort!.direction === "asc" ? "desc" : "asc"]
                  : labels[defaultDirectionFor(field)];

                return (
                  <th
                    key={column.label}
                    aria-sort={
                      isActive
                        ? sort!.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={cn("text-left text-sm font-bold", column.width)}
                  >
                    <button
                      type="button"
                      onClick={() => handleHeaderClick(field)}
                      title={`Sort by ${column.label}: ${nextLabel}`}
                      className="w-full flex items-center gap-1.5 px-4 py-3 text-left font-bold transition-colors hover:bg-charcoal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-charcoal cursor-pointer"
                    >
                      {column.label}
                      {isActive ? (
                        sort!.direction === "asc" ? (
                          <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                        )
                      ) : (
                        <ChevronsUpDown
                          aria-hidden="true"
                          className="h-3.5 w-3.5 opacity-40"
                        />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => {
              const rowBackground =
                index % 2 === 0
                  ? "bg-primary/85 text-foreground"
                  : "bg-primary-dark text-foreground";
              const formattedStyles =
                event.styles && event.styles.length > 0
                  ? event.styles.join(", ")
                  : "-";
              const eventHref = `/events/${event.id}`;

              return (
                <tr
                  key={event.id}
                  onClick={() => handleNavigate(event.id)}
                  className={cn(
                    rowBackground,
                    "cursor-pointer border-b border-primary-light/25 transition-colors hover:bg-primary-light/20 focus-within:bg-primary-light/20"
                  )}
                >
                  <td className={cn(cellClassName, "whitespace-nowrap")}>
                    {formatDate(event.date, event.datePrecision)}
                  </td>
                  <td className={cellClassName}>
                    <Link
                      href={eventHref}
                      className="block truncate rounded-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                      title={event.title}
                      aria-label={`Open event ${event.title}`}
                    >
                      {clampTitle(event.title)}
                    </Link>
                  </td>
                  <td className={cn(cellClassName, "whitespace-nowrap")}>
                    {event.eventType || "-"}
                  </td>
                  <td className={cellClassName}>
                    <span
                      className="block truncate text-sm font-medium"
                      title={formattedStyles}
                    >
                      {formattedStyles}
                    </span>
                  </td>
                  <td className={cn(cellClassName, "whitespace-nowrap")}>
                    {event.city || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
