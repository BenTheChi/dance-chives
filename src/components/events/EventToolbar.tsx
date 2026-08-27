"use client";

import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EVENT_SORT_FIELDS,
  defaultDirectionFor,
  directionLabelsFor,
  sortFieldLabel,
  type EventSortField,
  type EventSortState,
} from "./event-sort";

interface EventToolbarProps {
  pastCount: number;
  futureCount: number;
  showFutureEvents: boolean;
  onShowFutureEventsChange: (showFuture: boolean) => void;

  keyword: string;
  onKeywordChange: (keyword: string) => void;

  sort: EventSortState;
  onSortChange: (sort: EventSortState) => void;

  activeFilterCount: number;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
}

export function EventToolbar({
  pastCount,
  futureCount,
  showFutureEvents,
  onShowFutureEventsChange,
  keyword,
  onKeywordChange,
  sort,
  onSortChange,
  activeFilterCount,
  filtersOpen,
  onFiltersOpenChange,
}: EventToolbarProps) {
  const directionLabels = directionLabelsFor(sort.field);

  const segmentClass = (active: boolean) =>
    cn(
      "flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-light",
      active
        ? "bg-secondary-light text-charcoal"
        : "text-foreground hover:bg-secondary-dark"
    );

  return (
    <div className="w-full bg-secondary sm:rounded-sm border-4 border-secondary-light p-3 flex flex-col gap-3">
      {/* Row 1: the highest-impact control (which half of the archive) and search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div
          role="group"
          aria-label="Show past or future events"
          className="flex items-center gap-1 p-1 bg-secondary-dark/60 rounded-sm border border-secondary-light shrink-0"
        >
          <button
            type="button"
            onClick={() => onShowFutureEventsChange(false)}
            aria-pressed={!showFutureEvents}
            className={segmentClass(!showFutureEvents)}
          >
            Past ({pastCount})
          </button>
          <button
            type="button"
            onClick={() => onShowFutureEventsChange(true)}
            aria-pressed={showFutureEvents}
            className={segmentClass(showFutureEvents)}
          >
            Future ({futureCount})
          </button>
        </div>

        <div className="relative flex-1 min-w-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <input
            type="text"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Search events, cities, styles…"
            aria-label="Search events"
            className="w-full h-10 pl-9 pr-9 rounded-sm border border-secondary-light bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-light"
            size={1}
          />
          {keyword.length > 0 && (
            <button
              type="button"
              onClick={() => onKeywordChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary-dark"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: filters toggle and sort */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => onFiltersOpenChange(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls="event-filters-panel"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-sm border border-secondary-light bg-secondary text-foreground font-bold hover:bg-secondary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-light"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-secondary-light text-charcoal text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 transition-transform",
              filtersOpen && "rotate-180"
            )}
          />
        </button>

        {/* Mirrors the sortable table headers, which are the primary control on
            desktop but scroll out of reach on a narrow screen. */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white shrink-0">Sort</span>
          <Select
            value={sort.field}
            onValueChange={(value) => {
              const field = value as EventSortField;
              // Match the table headers: a newly picked column starts at its
              // own default rather than inheriting the previous direction.
              onSortChange({ field, direction: defaultDirectionFor(field) });
            }}
          >
            <SelectTrigger className="h-10 min-w-0 flex-1 sm:w-[130px]" aria-label="Sort field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_SORT_FIELDS.map((field) => (
                <SelectItem key={field} value={field}>
                  {sortFieldLabel(field)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort.direction}
            onValueChange={(value) =>
              onSortChange({
                ...sort,
                direction: value as EventSortState["direction"],
              })
            }
          >
            <SelectTrigger className="h-10 min-w-0 flex-1 sm:w-[150px]" aria-label="Sort order">
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
  );
}
