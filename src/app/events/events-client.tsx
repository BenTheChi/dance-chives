"use client";

import { useEffect, useMemo, useState } from "react";
import { TEventCard, EventType } from "@/types/event";
import { City } from "@/types/city";
import { getCountryName } from "@/lib/utils/countries";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EventFilters } from "@/components/events/EventFilters";
import { EventTableView } from "@/components/events/EventTableView";
import { EventPagination } from "@/components/events/EventPagination";
import {
  EventSort,
  DEFAULT_EVENT_SORT,
  type EventSortState,
} from "@/components/events/EventSort";

/** Events rendered per page. */
const PAGE_SIZE = 50;

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
  // Applied filter values (used for actual filtering)
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

  // Draft filter values (used in the UI, not applied until save)
  const [draftCountryCode, setDraftCountryCode] = useState<string | null>(null);
  const [draftCityId, setDraftCityId] = useState<string | null>(null);
  const [draftStyles, setDraftStyles] = useState<string[]>([]);
  const [draftEventType, setDraftEventType] = useState<EventType | null>(null);
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [draftHasVideos, setDraftHasVideos] = useState(false);
  const [draftHasPoster, setDraftHasPoster] = useState(false);

  const [keyword, setKeyword] = useState("");

  // Applied and draft sort, mirroring the filter draft/apply pattern so the
  // shared Save button commits both at once.
  const [sort, setSort] = useState<EventSortState>(DEFAULT_EVENT_SORT);
  const [draftSort, setDraftSort] = useState<EventSortState>(DEFAULT_EVENT_SORT);

  // Paired with the result set it belongs to: when filters, sort, or the
  // past/future toggle change, the key no longer matches and the page falls
  // back to 1 during render. Deriving this beats an effect, which would flash
  // the wrong page for a render and trips react-hooks/set-state-in-effect.
  const [pageState, setPageState] = useState<{ key: string; page: number }>({
    key: "",
    page: 1,
  });

  // Default to showing future events if there are any
  const [showFutureEvents, setShowFutureEvents] = useState(
    futureEvents.length > 0
  );

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

    const scopedEvents = draftCountryCode
      ? sourceEvents.filter((event) => event.countryCode === draftCountryCode)
      : sourceEvents;

    // Get unique cityIds from the events
    const cityIds = new Set(
      scopedEvents
        .map((event) => event.cityId)
        .filter(
          (cityId): cityId is string => cityId !== undefined && cityId !== null
        )
    );

    // Filter cities to only include those that appear in the events
    return cities.filter((city) => cityIds.has(city.id));
  }, [cities, futureEvents, pastEvents, showFutureEvents, draftCountryCode]);

  // Filter event types to only show those available in the currently displayed events (past or future)
  const availableEventTypes = useMemo(() => {
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;

    // Get unique event types from the events
    const eventTypes = new Set(
      sourceEvents
        .map((event) => event.eventType)
        .filter(
          (eventType): eventType is EventType =>
            eventType !== undefined && eventType !== null
        )
    );

    // Return sorted array of available event types
    return Array.from(eventTypes).sort();
  }, [futureEvents, pastEvents, showFutureEvents]);

  // Sync draft values with applied values when they change externally
  useEffect(() => {
    setDraftCountryCode(selectedCountryCode);
    setDraftCityId(selectedCityId);
    setDraftStyles(selectedStyles);
    setDraftEventType(selectedEventType);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setDraftHasVideos(hasVideos);
    setDraftHasPoster(hasPoster);
    setDraftSort(sort);
  }, [
    selectedCountryCode,
    selectedCityId,
    selectedStyles,
    selectedEventType,
    startDate,
    endDate,
    hasVideos,
    hasPoster,
    sort,
  ]);

  // Reset selectedCityId if it's no longer in available cities
  useEffect(() => {
    if (
      selectedCityId &&
      !availableCities.some((city) => city.id === selectedCityId)
    ) {
      setSelectedCityId(null);
      setDraftCityId(null);
    }
  }, [availableCities, selectedCityId]);

  // Reset selectedEventType if it's no longer in available event types
  useEffect(() => {
    if (selectedEventType && !availableEventTypes.includes(selectedEventType)) {
      setSelectedEventType(null);
      setDraftEventType(null);
    }
  }, [availableEventTypes, selectedEventType]);

  // Handle saving filters - apply draft values to actual filter values
  // Nesting, derived rather than stored: a draft city that is not in the draft
  // country's city list reads as unselected. Deriving avoids an effect that
  // calls setState during render, which is the pattern eslint flags elsewhere
  // in this file — and it cannot fall out of step with availableCities.
  const effectiveDraftCityId =
    draftCityId && availableCities.some((city) => city.id === draftCityId)
      ? draftCityId
      : null;

  const handleSaveFilters = () => {
    setSelectedCountryCode(draftCountryCode);
    setSelectedCityId(effectiveDraftCityId);
    setSelectedStyles(draftStyles);
    setSelectedEventType(draftEventType);
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    setHasVideos(draftHasVideos);
    setHasPoster(draftHasPoster);
    setSort(draftSort);
  };

  // Handle clearing filters - reset all draft values to empty/default
  const handleClearFilters = () => {
    setDraftCountryCode(null);
    setDraftCityId(null);
    setDraftStyles([]);
    setDraftEventType(null);
    setDraftStartDate("");
    setDraftEndDate("");
    setDraftHasVideos(false);
    setDraftHasPoster(false);
    setDraftSort(DEFAULT_EVENT_SORT);
  };

  const filteredEvents = useMemo(() => {
    // Use the pre-sorted arrays based on showFutureEvents
    const sourceEvents = showFutureEvents ? futureEvents : pastEvents;

    if (!sourceEvents || sourceEvents.length === 0) return [];

    const normalizedKeyword = keyword.trim().toLowerCase();

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

    // Filter events based on city, styles, date range, and past event filters (hasVideos, hasPoster)
    // No need to filter by past/future since arrays are already separated
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

      if (selectedCityId && event.cityId !== selectedCityId) {
        return false;
      }

      if (selectedEventType && event.eventType !== selectedEventType) {
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
    // No sorting needed - events are already sorted server-side
  }, [
    futureEvents,
    pastEvents,
    showFutureEvents,
    selectedCountryCode,
    selectedCityId,
    selectedEventType,
    selectedStyles,
    startDate,
    endDate,
    hasVideos,
    hasPoster,
    keyword,
  ]);

  // Server-side order is already "closest to today first" for whichever list is
  // showing, so the default date sort is a pass-through and only its reverse
  // needs work. Non-date fields fall back to that existing order for ties,
  // which keeps equal titles/types/cities chronological.
  const sortedEvents = useMemo(() => {
    if (sort.field === "date") {
      return sort.direction === "desc"
        ? filteredEvents
        : [...filteredEvents].reverse();
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

    return [...filteredEvents]
      .map((event, index) => ({ event, index }))
      .sort((a, b) => {
        const valueA = valueFor(a.event);
        const valueB = valueFor(b.event);

        // Blanks sort last in both directions rather than clumping at
        // whichever end the collator happens to put the empty string.
        if (!valueA && !valueB) return a.index - b.index;
        if (!valueA) return 1;
        if (!valueB) return -1;

        const comparison = collator.compare(valueA, valueB);
        if (comparison !== 0) return comparison * multiplier;

        return a.index - b.index;
      })
      .map(({ event }) => event);
  }, [filteredEvents, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / PAGE_SIZE));

  // Identifies the current result set. Any change to it means the page the
  // user was on refers to a different list, so paging restarts at 1.
  const resultKey = JSON.stringify([
    showFutureEvents,
    selectedCountryCode,
    selectedCityId,
    selectedEventType,
    selectedStyles,
    startDate,
    endDate,
    hasVideos,
    hasPoster,
    keyword,
    sort,
  ]);

  // Clamp as well as reset: filtering down to fewer pages while on a high page
  // should render the last page immediately, not an empty list.
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

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:gap-4 items-center mb-10 w-full">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center gap-4 sm:gap-4 w-full">
            <EventFilters
              cities={availableCities}
              styles={styles}
              availableCountryCodes={availableCountryCodes}
              selectedCountryCode={draftCountryCode}
              onCountryChange={setDraftCountryCode}
              selectedCityId={effectiveDraftCityId}
              onCityChange={setDraftCityId}
              selectedStyles={draftStyles}
              onStylesChange={setDraftStyles}
              availableEventTypes={availableEventTypes}
              selectedEventType={draftEventType}
              onEventTypeChange={setDraftEventType}
              startDate={draftStartDate}
              onStartDateChange={setDraftStartDate}
              endDate={draftEndDate}
              onEndDateChange={setDraftEndDate}
              showPastEventFilters={!showFutureEvents}
              hasVideos={draftHasVideos}
              onHasVideosChange={setDraftHasVideos}
              hasPoster={draftHasPoster}
              onHasPosterChange={setDraftHasPoster}
            />

            <EventSort sort={draftSort} onSortChange={setDraftSort} />
          </div>

          {/* Sticky on mobile to match the Filters panel above, which pins
              itself there and auto-expands — otherwise Save/Clear scroll out
              of reach while the form stays on screen. */}
          <div className="w-full max-w-[550px] mx-auto flex gap-2 px-4 sm:px-0 py-2 sm:py-0 mt-0 sm:mt-0 sticky bottom-0 z-50 bg-charcoal sm:static sm:bg-transparent">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1 bg-neutral-300 text-charcoal font-bold border-charcoal"
            >
              Clear
            </Button>
            <Button
              onClick={handleSaveFilters}
              className="flex-1 bg-primary-light text-primary font-bold"
            >
              Save
            </Button>
          </div>

          <div className="w-full max-w-[550px] mx-auto flex items-center gap-2 bg-secondary p-3 sm:rounded-sm border-4 border-secondary-light">
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Keyword filter"
              aria-label="Keyword filter"
              className="w-full sm:flex-1 px-3 py-2 rounded-sm border border-secondary-light bg-secondary text-foreground"
              size={1}
            />
            <button
              type="button"
              onClick={() => setKeyword("")}
              disabled={keyword.trim().length === 0}
              className="px-3 py-2 rounded-sm border border-secondary-light bg-secondary text-foreground disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-5 w-full">
            <div className="flex items-center justify-center gap-3 bg-secondary p-3 sm:rounded-sm border-secondary-light w-full border-4 sm:max-w-[250px]">
              <Label
                htmlFor="future-events-switch"
                className="font-bold cursor-pointer"
              >
                ({pastEvents.length}) Past
              </Label>
              <Switch
                id="future-events-switch"
                checked={showFutureEvents}
                onCheckedChange={setShowFutureEvents}
              />
              <Label
                htmlFor="future-events-switch"
                className="font-bold cursor-pointer"
              >
                Future ({futureEvents.length})
              </Label>
            </div>
          </div>
        </div>
      </div>
      {sortedEvents.length > 0 && (
        <>
          <EventTableView className="mt-6" events={paginatedEvents} />
          <EventPagination
            className="mt-6"
            currentPage={safePage}
            totalPages={totalPages}
            rangeStart={pageStartIndex + 1}
            rangeEnd={pageStartIndex + paginatedEvents.length}
            totalItems={sortedEvents.length}
            onPageChange={handlePageChange}
          />
        </>
      )}
      {sortedEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {showFutureEvents
              ? "No future events found."
              : "No past events found."}
          </p>
        </div>
      )}
    </>
  );
}
