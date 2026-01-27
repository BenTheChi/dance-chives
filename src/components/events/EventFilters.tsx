"use client";

import { useMemo, useState, useEffect } from "react";
import { City } from "@/types/city";
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
import { Check, ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EventType } from "@/types/event";

interface EventFiltersProps {
  cities: City[];
  styles: string[];
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
  onSave?: () => void; // Callback when save button is clicked
  onClear?: () => void; // Callback when clear button is clicked
}

export function EventFilters({
  cities,
  styles,
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
  onSave,
  onClear,
}: EventFiltersProps) {
  const [styleSearch, setStyleSearch] = useState("");
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!stylePopoverOpen) {
      setStyleSearch("");
    }
  }, [stylePopoverOpen]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      onStylesChange(selectedStyles.filter((s) => s !== style));
    } else {
      onStylesChange([...selectedStyles, style]);
    }
  };

  const displayedStyles = useMemo(() => {
    const search = styleSearch.trim().toLowerCase();
    if (!search) return styles;
    return styles.filter((style) =>
      formatStyleNameForDisplay(style).toLowerCase().includes(search)
    );
  }, [styles, styleSearch]);

  return (
    <div
      className={`flex flex-col w-full bg-secondary rounded-sm border-4 border-secondary-light max-w-[550px] mx-auto ${
        isMobile ? "sticky top-0 z-50" : ""
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-2 w-full text-left"
      >
        <span className="!font-bold !text-xl text-white text-center w-full">
          Filters
        </span>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-white" />
        ) : (
          <ChevronDown className="h-5 w-5 text-white" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid gap-4 grid-cols-2">
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
                    .filter((city) => (city.id || "").trim() !== "")
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
                onOpenChange={setStylePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-neutral-300 text-black"
                  >
                    {selectedStyles.length > 0
                      ? `${selectedStyles.length} selected`
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
                            const isSelected = selectedStyles.includes(style);
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
                {selectedStyles.map((style) => (
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
          {(onSave || onClear) && (
            <div className="mt-4 col-span-2 flex gap-2">
              {onClear && (
                <Button
                  onClick={() => {
                    onClear();
                  }}
                  variant="outline"
                  className="flex-1 bg-neutral-300 text-charcoal font-bold border-charcoal"
                >
                  Clear
                </Button>
              )}
              {onSave && (
                <Button
                  onClick={() => {
                    onSave();
                    setIsExpanded(false);
                  }}
                  className="flex-1 bg-primary-light text-primary font-bold"
                >
                  Save
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
