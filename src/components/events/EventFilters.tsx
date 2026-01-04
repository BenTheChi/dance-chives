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
import { Check, ChevronsUpDown } from "lucide-react";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";

interface EventFiltersProps {
  cities: City[];
  styles: string[];
  selectedCityId: string | null;
  onCityChange: (cityId: string | null) => void;
  selectedStyles: string[];
  onStylesChange: (styles: string[]) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
}

export function EventFilters({
  cities,
  styles,
  selectedCityId,
  onCityChange,
  selectedStyles,
  onStylesChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: EventFiltersProps) {
  const [styleSearch, setStyleSearch] = useState("");
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);

  useEffect(() => {
    if (!stylePopoverOpen) {
      setStyleSearch("");
    }
  }, [stylePopoverOpen]);

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
    <div className="flex flex-col gap-4 w-full bg-secondary p-4 rounded-sm border-4 border-secondary-light">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                  {city.region ? `, ${city.region}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
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
    </div>
  );
}

