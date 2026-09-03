"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEventCard } from "@/types/event";
import { formatEventDate } from "@/lib/utils/date-display";
import { EventThumbnail } from "./EventThumbnail";
import { DatePrecisionTag, GapAffordance } from "./GapAffordance";
import { hasCityGap } from "@/lib/utils/event-gaps";
import {
  defaultDirectionFor,
  directionLabelsFor,
  type EventSortField,
  type EventSortState,
} from "./event-sort";

const TITLE_CHAR_LIMIT = 48;

/** Styles shown inline before collapsing to "+N", matching EventCard. */
const STYLE_BADGE_LIMIT = 2;

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
  align?: "right";
  /** Hidden on narrow screens — the table already scrolls, and these are the
   *  first things worth dropping when it does. */
  hideBelow?: "sm" | "lg";
}> = [
  { label: "", width: "w-[76px]" },
  { label: "Event", width: "w-[300px]", field: "title" },
  { label: "Date", width: "w-[130px]", field: "date" },
  { label: "City", width: "w-[180px]", field: "city" },
  { label: "Styles", width: "w-[210px]", hideBelow: "lg" },
  { label: "Videos", width: "w-[90px]", field: "videoCount", align: "right" },
  {
    label: "Sections",
    width: "w-[100px]",
    field: "sectionCount",
    align: "right",
    hideBelow: "lg",
  },
];

function clampTitle(title: string): string {
  if (title.length <= TITLE_CHAR_LIMIT) return title;
  return `${title.slice(0, TITLE_CHAR_LIMIT).trimEnd()}...`;
}

export function EventTableView({
  events,
  className,
  sort,
  onSortChange,
}: EventTableViewProps) {
  const router = useRouter();
  const cellClassName = "px-3 py-2 text-sm font-medium";
  const sortable = Boolean(sort && onSortChange);

  const handleNavigate = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  // Clicking the active column flips direction; a new column starts at its
  // default — A–Z for text columns, newest first for dates, largest first for
  // counts.
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

  const hiddenClass = (hideBelow?: "sm" | "lg") =>
    hideBelow === "lg"
      ? "hidden lg:table-cell"
      : hideBelow === "sm"
        ? "hidden sm:table-cell"
        : "";

  return (
    <div
      className={cn(
        "w-full max-w-[1200px] mx-auto bg-primary-dark sm:rounded-sm border-4 border-primary-light overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed">
          <thead className="bg-primary-light text-charcoal">
            <tr>
              {COLUMNS.map((column) => {
                const isActive = sort?.field === column.field;
                const canSort = sortable && column.field !== undefined;

                if (!canSort) {
                  return (
                    <th
                      key={column.label || "thumb"}
                      // The thumbnail column has no header text; it is
                      // decorative and must not be announced as a column.
                      scope={column.label ? "col" : undefined}
                      className={cn(
                        "px-3 py-3 text-left text-sm font-bold",
                        column.width,
                        column.align === "right" && "text-right",
                        hiddenClass(column.hideBelow),
                      )}
                    >
                      {column.label ? (
                        column.label
                      ) : (
                        <span className="sr-only">Thumbnail</span>
                      )}
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
                    scope="col"
                    aria-sort={
                      isActive
                        ? sort!.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={cn(
                      "text-left text-sm font-bold",
                      column.width,
                      hiddenClass(column.hideBelow),
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleHeaderClick(field)}
                      title={`Sort by ${column.label}: ${nextLabel}`}
                      className={cn(
                        "w-full flex items-center gap-1.5 px-3 py-3 font-bold transition-colors hover:bg-charcoal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-charcoal cursor-pointer",
                        column.align === "right"
                          ? "justify-end text-right"
                          : "text-left",
                      )}
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
              const eventHref = `/events/${event.id}`;

              const visibleStyles = (event.styles || []).slice(
                0,
                STYLE_BADGE_LIMIT,
              );
              const extraStyleCount =
                (event.styles?.length ?? 0) - visibleStyles.length;

              const cityGap = hasCityGap(event.cityId, event.city);

              return (
                <tr
                  key={event.id}
                  onClick={() => handleNavigate(event.id)}
                  className={cn(
                    rowBackground,
                    "cursor-pointer border-b border-primary-light/25 transition-colors hover:bg-primary-light/20 focus-within:bg-primary-light/20",
                  )}
                >
                  {/* Thumbnail: small on purpose. It exists to make rows
                      scannable, not to become the content. */}
                  <td className={cn(cellClassName, "w-[76px]")}>
                    <div className="relative w-[64px] h-[36px] overflow-hidden rounded-sm">
                      <EventThumbnail
                        videoSrc={event.thumbnailVideoSrc}
                        posterUrl={event.imageUrl}
                        title={event.title}
                        sizes="64px"
                      />
                    </div>
                  </td>

                  {/* Title, with the series beneath it. `series` has been on
                      EventCard all along without ever being rendered; in a list
                      it is what distinguishes one edition from the next. */}
                  <td className={cellClassName}>
                    <Link
                      href={eventHref}
                      className="event-title block truncate rounded-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                      title={event.title}
                      aria-label={`Open event ${event.title}`}
                    >
                      {clampTitle(event.title)}
                    </Link>
                    {event.series && (
                      <span
                        className="block truncate text-xs text-muted-foreground"
                        title={event.series}
                      >
                        {event.series}
                      </span>
                    )}
                  </td>

                  {/* Date renders at its real precision — "2019", not a
                      fabricated "01/01/19" — with a tag saying why it is short. */}
                  <td className={cn(cellClassName, "whitespace-nowrap")}>
                    {event.date ? (
                      <>
                        <span className="block">
                          {formatEventDate(event.date, event.datePrecision)}
                        </span>
                        <DatePrecisionTag precision={event.datePrecision} />
                      </>
                    ) : (
                      <GapAffordance label="Add date" />
                    )}
                  </td>

                  <td className={cn(cellClassName, "whitespace-nowrap")}>
                    {cityGap ? (
                      <GapAffordance label="Add city" />
                    ) : (
                      <span className="block truncate" title={event.city}>
                        {event.city}
                      </span>
                    )}
                  </td>

                  <td className={cn(cellClassName, hiddenClass("lg"))}>
                    {visibleStyles.length > 0 ? (
                      <span
                        className="block truncate text-sm"
                        title={(event.styles || []).join(", ")}
                      >
                        {visibleStyles.join(", ")}
                        {extraStyleCount > 0 && (
                          <span className="text-muted-foreground">
                            {" "}
                            +{extraStyleCount}
                          </span>
                        )}
                      </span>
                    ) : (
                      <GapAffordance label="Add styles" />
                    )}
                  </td>

                  {/* tabular-nums keeps the digits in a column rather than
                      letting proportional figures ripple down the page. */}
                  <td
                    className={cn(
                      cellClassName,
                      "text-right tabular-nums whitespace-nowrap",
                    )}
                  >
                    {event.videoCount ? event.videoCount.toLocaleString() : "-"}
                  </td>
                  <td
                    className={cn(
                      cellClassName,
                      "text-right tabular-nums whitespace-nowrap",
                      hiddenClass("lg"),
                    )}
                  >
                    {event.sectionCount || "-"}
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
