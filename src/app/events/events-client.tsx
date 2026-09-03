"use client";

import { useMemo, useState } from "react";
import { TEventCard, EventType } from "@/types/event";
import { City } from "@/types/city";
import { getCountryName } from "@/lib/utils/countries";
import { useDebounce } from "@/hooks/use-debounce";
import { EventFilters } from "@/components/events/EventFilters";
import { EventTableView } from "@/components/events/EventTableView";
import { EventPagination } from "@/components/events/EventPagination";
import { EventToolbar } from "@/components/events/EventToolbar";
import {
  ActiveFilterChips,
  type ActiveFilterChip,
} from "@/components/events/ActiveFilterChips";
import {
  DEFAULT_EVENT_SORT,
  sortEvents,
  type EventSortState,
} from "@/components/events/event-sort";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";
import { EventCard } from "@/components/EventCard";
import {
  DEFAULT_EVENT_VIEW,
  needsInfo,
  type EventView,
} from "@/components/events/event-view";

/** Events rendered per page. */
const PAGE_SIZE = 50;

/**
 * Keystrokes update the input immediately but only re-filter after this pause.
 * Filtering itself is cheap; this keeps typing smooth as the archive grows.
 */
const KEYWORD_DEBOUNCE_MS = 200;

interface EventsClientProps {
  futureEvents: TEventCard[];
  pastEvents: TEventCard[];
  cities: City[];
  styles: string[];
}

export function EventsClient({
  futureEvents,
  pastEvents,
  cities,
  styles,
}: EventsClientProps) {
  // Filters apply on change. Everything is already in memory, so there is no
  // round trip to batch behind a Save button — and pagination recomputes from
  // the full filtered set, not just the visible page.
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null
  );
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasVideos, setHasVideos] = useState(false);
  const [hasPoster, setHasPoster] = useState(false);

  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, KEYWORD_DEBOUNCE_MS);

  const [sort, setSort] = useState<EventSortState>(DEFAULT_EVENT_SORT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<EventView>(DEFAULT_EVENT_VIEW);
  const [needsInfoOnly, setNeedsInfoOnly] = useState(false);

  // Default to showing future events if there are any
  const [showFutureEvents, setShowFutureEvents] = useState(
    futureEvents.length > 0
  );

  const [pageState, setPageState] = useState<{ key: string; page: number }>({
    key: "",
    page: 1,
  });

  const parseEventDate = (value: string): Date | null => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  // Countries present in the currently displayed events, sorted by name.
  // Sourced from the events rather than the city list because country-only
  // events have no real city — their cityId is the `unknown` sentinel — so the
  // country filter is the only way to reach them at all.
  const availableCountryCodes = useMemo(() => {
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;
    const codes = new Set(
      sourceEvents
        .map((event) => event.countryCode)
        .filter((code): code is string => !!code && code.trim() !== "")
    );

    return Array.from(codes).sort((a, b) =>
      getCountryName(a).localeCompare(getCountryName(b))
    );
  }, [futureEvents, pastEvents, showFutureEvents]);

  // Filter cities to only show those available in the currently displayed
  // events, and — when a country is selected — only that country's cities.
  // Nesting the two is what makes the pair usable: picking France should not
  // leave 140 unrelated cities in the list.
  const availableCities = useMemo(() => {
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;

    const scopedEvents = selectedCountryCode
      ? sourceEvents.filter(
          (event) => event.countryCode === selectedCountryCode
        )
      : sourceEvents;

    const cityIds = new Set(
      scopedEvents
        .map((event) => event.cityId)
        .filter(
          (cityId): cityId is string => cityId !== undefined && cityId !== null
        )
    );

    return cities.filter((city) => cityIds.has(city.id));
  }, [cities, futureEvents, pastEvents, showFutureEvents, selectedCountryCode]);

  // Filter event types to only show those available in the currently displayed events
  const availableEventTypes = useMemo(() => {
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;

    const eventTypes = new Set(
      sourceEvents
        .map((event) => event.eventType)
        .filter(
          (eventType): eventType is EventType =>
            eventType !== undefined && eventType !== null
        )
    );

    return Array.from(eventTypes).sort();
  }, [futureEvents, pastEvents, showFutureEvents]);

  // Derived rather than stored: a selected city that is not in the selected
  // country's city list reads as unselected, and a selected type that the
  // current half of the archive does not contain reads as unselected. Deriving
  // avoids effects that call setState during render.
  const effectiveCityId =
    selectedCityId && availableCities.some((city) => city.id === selectedCityId)
      ? selectedCityId
      : null;

  const effectiveEventType =
    selectedEventType && availableEventTypes.includes(selectedEventType)
      ? selectedEventType
      : null;

  const handleClearFilters = () => {
    setSelectedCountryCode(null);
    setSelectedCityId(null);
    setSelectedStyles([]);
    setSelectedEventType(null);
    setStartDate("");
    setEndDate("");
    setHasVideos(false);
    setHasPoster(false);
    setNeedsInfoOnly(false);
  };

  const filteredEvents = useMemo(() => {
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;

    if (!sourceEvents || sourceEvents.length === 0) return [];

    const normalizedKeyword = debouncedKeyword.trim().toLowerCase();

    let parsedStartDate: Date | null = null;
    if (startDate) {
      const candidate = new Date(startDate);
      if (!Number.isNaN(candidate.getTime())) {
        candidate.setHours(0, 0, 0, 0);
        parsedStartDate = candidate;
      }
    }

    let parsedEndDate: Date | null = null;
    if (endDate) {
      const candidate = new Date(endDate);
      if (!Number.isNaN(candidate.getTime())) {
        candidate.setHours(23, 59, 59, 999);
        parsedEndDate = candidate;
      }
    }

    return sourceEvents.filter((event) => {
      if (!event.date) return false;

      const eventDate = parseEventDate(event.date);

      if (normalizedKeyword) {
        const searchableText = [
          event.title,
          event.series,
          event.city,
          event.eventType,
          ...(event.styles || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(normalizedKeyword)) {
          return false;
        }
      }

      if (selectedCountryCode && event.countryCode !== selectedCountryCode) {
        return false;
      }

      if (effectiveCityId && event.cityId !== effectiveCityId) {
        return false;
      }

      if (effectiveEventType && event.eventType !== effectiveEventType) {
        return false;
      }

      if (selectedStyles.length > 0) {
        const eventStyleSet = new Set(
          (event.styles || []).map((style) => style.toLowerCase())
        );
        const hasMatch = selectedStyles.some((style) =>
          eventStyleSet.has(style.toLowerCase())
        );
        if (!hasMatch) {
          return false;
        }
      }

      if (parsedStartDate && eventDate && eventDate < parsedStartDate) {
        return false;
      }

      if (parsedEndDate && eventDate && eventDate > parsedEndDate) {
        return false;
      }

      if (needsInfoOnly && !needsInfo(event)) {
        return false;
      }

      // Past event filters (only apply when showing past events)
      if (!showFutureEvents) {
        if (hasVideos && !event.hasVideos) {
          return false;
        }

        if (hasPoster && !event.imageUrl) {
          return false;
        }
      }

      return true;
    });
  }, [
    futureEvents,
    pastEvents,
    showFutureEvents,
    selectedCountryCode,
    effectiveCityId,
    effectiveEventType,
    selectedStyles,
    startDate,
    endDate,
    hasVideos,
    hasPoster,
    needsInfoOnly,
    debouncedKeyword,
  ]);

  const sortedEvents = useMemo(
    () => sortEvents(filteredEvents, sort),
    [filteredEvents, sort]
  );

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / PAGE_SIZE));

  // Identifies the current result set. Any change means the page the user was
  // on refers to a different list, so paging restarts at 1 — derived during
  // render rather than through an effect, which would flash the wrong page.
  const resultKey = JSON.stringify([
    showFutureEvents,
    selectedCountryCode,
    effectiveCityId,
    effectiveEventType,
    selectedStyles,
    startDate,
    endDate,
    hasVideos,
    hasPoster,
    needsInfoOnly,
    debouncedKeyword,
    sort,
  ]);

  // Clamp as well as reset: filtering down to fewer pages while on a high page
  // should land on the last page, not an empty list.
  const safePage = Math.min(
    pageState.key === resultKey ? pageState.page : 1,
    totalPages
  );

  const pageStartIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedEvents = useMemo(
    () => sortedEvents.slice(pageStartIndex, pageStartIndex + PAGE_SIZE),
    [sortedEvents, pageStartIndex]
  );

  const handlePageChange = (page: number) => {
    setPageState({
      key: resultKey,
      page: Math.min(Math.max(page, 1), totalPages),
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keyword is deliberately excluded — it has its own visible input with a
  // clear affordance, so a chip would be redundant.
  const activeChips = useMemo(() => {
    const chips: ActiveFilterChip[] = [];

    if (effectiveEventType) {
      chips.push({
        id: "type",
        label: effectiveEventType,
        onRemove: () => setSelectedEventType(null),
      });
    }

    if (selectedCountryCode) {
      chips.push({
        id: "country",
        label: getCountryName(selectedCountryCode),
        onRemove: () => setSelectedCountryCode(null),
      });
    }

    if (effectiveCityId) {
      const city = availableCities.find((c) => c.id === effectiveCityId);
      chips.push({
        id: "city",
        label: city?.name ?? "City",
        onRemove: () => setSelectedCityId(null),
      });
    }

    selectedStyles.forEach((style) => {
      chips.push({
        id: `style-${style}`,
        label: formatStyleNameForDisplay(style),
        onRemove: () =>
          setSelectedStyles((current) => current.filter((s) => s !== style)),
      });
    });

    if (startDate) {
      chips.push({
        id: "start-date",
        label: `From ${startDate}`,
        onRemove: () => setStartDate(""),
      });
    }

    if (endDate) {
      chips.push({
        id: "end-date",
        label: `Until ${endDate}`,
        onRemove: () => setEndDate(""),
      });
    }

    if (!showFutureEvents && hasVideos) {
      chips.push({
        id: "has-videos",
        label: "Has videos",
        onRemove: () => setHasVideos(false),
      });
    }

    if (!showFutureEvents && hasPoster) {
      chips.push({
        id: "has-poster",
        label: "Has poster",
        onRemove: () => setHasPoster(false),
      });
    }

    if (needsInfoOnly) {
      chips.push({
        id: "needs-info",
        label: "Needs info",
        onRemove: () => setNeedsInfoOnly(false),
      });
    }

    return chips;
  }, [
    effectiveEventType,
    selectedCountryCode,
    effectiveCityId,
    availableCities,
    selectedStyles,
    startDate,
    endDate,
    hasVideos,
    hasPoster,
    needsInfoOnly,
    showFutureEvents,
  ]);

  // Counted over the half of the archive currently shown, and before the other
  // filters apply — the badge is an invitation to look at the gaps, so it must
  // not shrink as unrelated filters narrow the list.
  const needsInfoCount = useMemo(
    () =>
      (showFutureEvents ? futureEvents : pastEvents).filter(needsInfo).length,
    [futureEvents, pastEvents, showFutureEvents]
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-4">
      <EventToolbar
        pastCount={pastEvents.length}
        futureCount={futureEvents.length}
        showFutureEvents={showFutureEvents}
        onShowFutureEventsChange={setShowFutureEvents}
        keyword={keyword}
        onKeywordChange={setKeyword}
        sort={sort}
        onSortChange={setSort}
        activeFilterCount={activeChips.length}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        view={view}
        onViewChange={setView}
        needsInfoCount={needsInfoCount}
        needsInfoOnly={needsInfoOnly}
        onNeedsInfoOnlyChange={setNeedsInfoOnly}
      />

      {filtersOpen && (
        <EventFilters
          cities={availableCities}
          styles={styles}
          availableCountryCodes={availableCountryCodes}
          selectedCountryCode={selectedCountryCode}
          onCountryChange={setSelectedCountryCode}
          selectedCityId={effectiveCityId}
          onCityChange={setSelectedCityId}
          selectedStyles={selectedStyles}
          onStylesChange={setSelectedStyles}
          availableEventTypes={availableEventTypes}
          selectedEventType={effectiveEventType}
          onEventTypeChange={setSelectedEventType}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          showPastEventFilters={!showFutureEvents}
          hasVideos={hasVideos}
          onHasVideosChange={setHasVideos}
          hasPoster={hasPoster}
          onHasPosterChange={setHasPoster}
        />
      )}

      <ActiveFilterChips chips={activeChips} onClearAll={handleClearFilters} />

      {sortedEvents.length > 0 ? (
        <>
          {view === "list" ? (
            <EventTableView
              events={paginatedEvents}
              sort={sort}
              onSortChange={setSort}
            />
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {paginatedEvents.map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          )}
          <EventPagination
            currentPage={safePage}
            totalPages={totalPages}
            rangeStart={pageStartIndex + 1}
            rangeEnd={pageStartIndex + paginatedEvents.length}
            totalItems={sortedEvents.length}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {showFutureEvents
              ? "No future events found."
              : "No past events found."}
          </p>
          {activeChips.length > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-3 text-sm font-bold underline underline-offset-4 hover:text-foreground cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
