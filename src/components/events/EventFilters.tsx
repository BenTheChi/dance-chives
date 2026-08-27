"use client";

import { useMemo, useState } from "react";
import { City } from "@/types/city";
import { isSentinelCityId } from "@/lib/utils/city-display";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StyleBadge } from "@/components/ui/style-badge";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  formatStyleNameForDisplay,
  normalizeStyleNames,
} from "@/lib/utils/style-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EventType } from "@/types/event";
import { getCountryName } from "@/lib/utils/countries";

interface EventFiltersProps {
  cities: City[];
  styles: string[];
  /** ISO codes present in the currently displayed events, sorted by name. */
  availableCountryCodes: string[];
  selectedCountryCode: string | null;
  onCountryChange: (countryCode: string | null) => void;
  selectedCityId: string | null;
  onCityChange: (cityId: string | null) => void;
  selectedStyles: string[];
  onStylesChange: (styles: string[]) => void;
  availableEventTypes: EventType[];
  selectedEventType: EventType | null;
  onEventTypeChange: (eventType: EventType | null) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  showPastEventFilters?: boolean; // Whether to show Has Videos and Has Poster filters
  hasVideos: boolean;
  onHasVideosChange: (checked: boolean) => void;
  hasPoster: boolean;
  onHasPosterChange: (checked: boolean) => void;
}

export function EventFilters({
  cities,
  styles,
  availableCountryCodes,
  selectedCountryCode,
  onCountryChange,
  selectedCityId,
  onCityChange,
  selectedStyles,
  onStylesChange,
  availableEventTypes,
  selectedEventType,
  onEventTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  showPastEventFilters = false,
  hasVideos,
  onHasVideosChange,
  hasPoster,
  onHasPosterChange,
}: EventFiltersProps) {
  const [styleSearch, setStyleSearch] = useState("");
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);

  // Clearing the search on close is an event, not state to synchronize, so it
  // belongs in the open-change handler rather than an effect.
  const handleStylePopoverOpenChange = (open: boolean) => {
    setStylePopoverOpen(open);
    if (!open) {
      setStyleSearch("");
    }
  };

  const canonicalSelectedStyles = useMemo(
    () => normalizeStyleNames(selectedStyles, { strict: false }),
    [selectedStyles]
  );

  const toggleStyle = (style: string) => {
    const canonicalStyle = normalizeStyleNames([style], { strict: false })[0];
    if (!canonicalStyle) {
      return;
    }

    if (canonicalSelectedStyles.includes(canonicalStyle)) {
      onStylesChange(
        canonicalSelectedStyles.filter((s) => s !== canonicalStyle)
      );
    } else {
      onStylesChange([...canonicalSelectedStyles, canonicalStyle]);
    }
  };

  const uniqueStyles = useMemo(() => {
    return normalizeStyleNames(styles, { strict: false });
  }, [styles]);

  const displayedStyles = useMemo(() => {
    const search = styleSearch.trim().toLowerCase();
    if (!search) return uniqueStyles;
    return uniqueStyles.filter((style) =>
      formatStyleNameForDisplay(style).toLowerCase().includes(search)
    );
  }, [uniqueStyles, styleSearch]);

  return (
    <div
      id="event-filters-panel"
      className="w-full bg-secondary sm:rounded-sm border-4 border-t-0 sm:border-t-4 border-secondary-light"
    >
      <div className="p-4">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white">Type</label>
              <Select
                value={selectedEventType ?? "all"}
                onValueChange={(value) =>
                  onEventTypeChange(
                    value === "all" ? null : (value as EventType)
                  )
                }
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {availableEventTypes.map((eventType) => (
                    <SelectItem key={eventType} value={eventType}>
                      {eventType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white">Country</label>
              <Select
                value={selectedCountryCode ?? "all"}
                onValueChange={(value) =>
                  onCountryChange(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {availableCountryCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {getCountryName(code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white">City</label>
              <Select
                value={selectedCityId ?? "all"}
                onValueChange={(value) =>
                  onCityChange(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {cities
                    .filter(
                      (city) =>
                        (city.id || "").trim() !== "" &&
                        // Sentinels ("Online", "Unknown", "Unknown, France")
                        // are placeholders, not places. Filtering by one would
                        // mean "show me events whose location we don't know",
                        // which is not a browse intent.
                        !isSentinelCityId(city.id)
                    )
                    .map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                        {city.region ? `, ${city.region}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-sm font-bold text-white">Styles</label>
              <Popover
                open={stylePopoverOpen}
                onOpenChange={handleStylePopoverOpenChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-neutral-300 text-black"
                  >
                    {canonicalSelectedStyles.length > 0
                      ? `${canonicalSelectedStyles.length} selected`
                      : "Select styles"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-black" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full max-w-[320px] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Search styles..."
                      value={styleSearch}
                      onValueChange={setStyleSearch}
                    />
                    <CommandList>
                      {displayedStyles.length === 0 ? (
                        <CommandEmpty>No styles found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {displayedStyles.map((style) => {
                            const isSelected =
                              canonicalSelectedStyles.includes(style);
                            return (
                              <CommandItem
                                key={style}
                                onSelect={() => toggleStyle(style)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 transition-opacity ${
                                    isSelected ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {formatStyleNameForDisplay(style)}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex flex-wrap gap-1">
                {canonicalSelectedStyles.map((style) => (
                  <StyleBadge
                    key={style}
                    style={style}
                    showRemoveButton
                    onRemove={() => toggleStyle(style)}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="rounded-sm border border-border bg-neutral-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => onEndDateChange(event.target.value)}
                className="rounded-sm border border-border bg-neutral-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          {showPastEventFilters && (
            <div className="flex flex-wrap gap-6 items-center mt-4 col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasVideos"
                  checked={hasVideos}
                  onCheckedChange={(checked) =>
                    onHasVideosChange(checked === true)
                  }
                />
                <Label
                  htmlFor="hasVideos"
                  className="text-sm font-bold text-white cursor-pointer"
                >
                  Has Videos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPoster"
                  checked={hasPoster}
                  onCheckedChange={(checked) =>
                    onHasPosterChange(checked === true)
                  }
                />
                <Label
                  htmlFor="hasPoster"
                  className="text-sm font-bold text-white cursor-pointer"
                >
                  Has Poster
                </Label>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
