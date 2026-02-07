"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VideoFilters } from "@/types/video-filter";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";

interface VideoFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: VideoFilters;
  defaultFilters?: VideoFilters;
  availableCities: string[];
  availableStyles: string[];
  onApply: (filters: VideoFilters) => void;
  onClear: () => void;
}

const fourDigitPattern = /^\d{4}$/;

export function VideoFilterDialog({
  isOpen,
  onClose,
  filters,
  defaultFilters,
  availableCities,
  availableStyles,
  onApply,
  onClear,
}: VideoFilterDialogProps) {
  const [yearFromText, setYearFromText] = useState(
    filters.yearFrom ? String(filters.yearFrom) : ""
  );
  const [yearToText, setYearToText] = useState(
    filters.yearTo ? String(filters.yearTo) : ""
  );
  const [selectedCities, setSelectedCities] = useState<string[]>(
    filters.cities ?? []
  );
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    filters.styles ?? []
  );
  const [finalsOnly, setFinalsOnly] = useState(filters.finalsOnly ?? false);
  const [noPrelims, setNoPrelims] = useState(filters.noPrelims ?? false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">(
    filters.sortOrder ?? "desc"
  );
  const [yearError, setYearError] = useState<string | null>(null);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);
  const [styleSearch, setStyleSearch] = useState("");
  const latestFiltersRef = useRef(filters);

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!isOpen) return;
    const nextFilters = latestFiltersRef.current;
    setYearFromText(nextFilters.yearFrom ? String(nextFilters.yearFrom) : "");
    setYearToText(nextFilters.yearTo ? String(nextFilters.yearTo) : "");
    setSelectedCities(nextFilters.cities ?? []);
    setSelectedStyles(nextFilters.styles ?? []);
    setFinalsOnly(nextFilters.finalsOnly ?? false);
    setNoPrelims(nextFilters.noPrelims ?? false);
    setSortOrder(nextFilters.sortOrder ?? "desc");
    setYearError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!cityPopoverOpen) setCitySearch("");
  }, [cityPopoverOpen]);

  useEffect(() => {
    if (!stylePopoverOpen) setStyleSearch("");
  }, [stylePopoverOpen]);

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      setSelectedCities(selectedCities.filter((c) => c !== city));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  const displayedCities = useMemo(() => {
    const search = citySearch.trim().toLowerCase();
    if (!search) return availableCities;
    return availableCities.filter((city) =>
      city.toLowerCase().includes(search)
    );
  }, [availableCities, citySearch]);

  const displayedStyles = useMemo(() => {
    const search = styleSearch.trim().toLowerCase();
    if (!search) return availableStyles;
    return availableStyles.filter((style) =>
      formatStyleNameForDisplay(style).toLowerCase().includes(search)
    );
  }, [availableStyles, styleSearch]);

  const parsedYearFrom = useMemo(() => {
    const trimmed = yearFromText.trim();
    return fourDigitPattern.test(trimmed) ? Number(trimmed) : undefined;
  }, [yearFromText]);

  const parsedYearTo = useMemo(() => {
    const trimmed = yearToText.trim();
    return fourDigitPattern.test(trimmed) ? Number(trimmed) : undefined;
  }, [yearToText]);
  const yearFromInputId = "video-filter-year-from";
  const yearToInputId = "video-filter-year-to";

  const validateYears = () => {
    setYearError(null);
    if (yearFromText && !fourDigitPattern.test(yearFromText)) {
      setYearError("Year must be four digits");
      return false;
    }
    if (yearToText && !fourDigitPattern.test(yearToText)) {
      setYearError("Year must be four digits");
      return false;
    }
    if (
      parsedYearFrom !== undefined &&
      parsedYearTo !== undefined &&
      parsedYearFrom >= parsedYearTo
    ) {
      setYearError("Left year must be less than right year");
      return false;
    }
    return true;
  };

  const selectedFilters: VideoFilters = {
    yearFrom: parsedYearFrom,
    yearTo: parsedYearTo,
    cities: selectedCities.length > 0 ? selectedCities : undefined,
    styles: selectedStyles.length > 0 ? selectedStyles : undefined,
    finalsOnly: finalsOnly || undefined,
    noPrelims: noPrelims || undefined,
    sortOrder,
  };

  const handleApply = () => {
    if (!validateYears()) {
      return;
    }
    onApply(selectedFilters);
  };

  const handleClear = () => {
    onClear();
    setYearFromText(
      defaultFilters?.yearFrom ? String(defaultFilters.yearFrom) : ""
    );
    setYearToText(defaultFilters?.yearTo ? String(defaultFilters.yearTo) : "");
    setSelectedCities(defaultFilters?.cities ?? []);
    setSelectedStyles(defaultFilters?.styles ?? []);
    setFinalsOnly(defaultFilters?.finalsOnly ?? false);
    setNoPrelims(defaultFilters?.noPrelims ?? false);
    setSortOrder(defaultFilters?.sortOrder ?? "desc");
    setYearError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={yearFromInputId}
                  className="text-[13px] font-bold text-muted-foreground"
                >
                  From
                </Label>
                <Input
                  id={yearFromInputId}
                  placeholder="YYYY"
                  value={yearFromText}
                  onChange={(event) => setYearFromText(event.target.value)}
                  maxLength={4}
                  className="w-full max-w-[120px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={yearToInputId}
                  className="text-[13px] font-bold text-muted-foreground"
                >
                  To
                </Label>
                <Input
                  id={yearToInputId}
                  placeholder="YYYY"
                  value={yearToText}
                  onChange={(event) => setYearToText(event.target.value)}
                  maxLength={4}
                  className="w-full max-w-[120px]"
                />
              </div>
            </div>
            {yearError && (
              <p className="text-xs text-destructive-foreground">{yearError}</p>
            )}
          </div>

          <div>
            <p className="!font-bold">City</p>
            <Popover
              open={cityPopoverOpen}
              onOpenChange={setCityPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  disabled={availableCities.length === 0}
                >
                  {selectedCities.length > 0
                    ? `${selectedCities.length} selected`
                    : "Select cities"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full max-w-[320px] p-0"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search cities..."
                    value={citySearch}
                    onValueChange={setCitySearch}
                  />
                  <CommandList>
                    {displayedCities.length === 0 ? (
                      <CommandEmpty>No cities found.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {displayedCities.map((city) => {
                          const isSelected = selectedCities.includes(city);
                          return (
                            <CommandItem
                              key={city}
                              onSelect={() => toggleCity(city)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 transition-opacity ${
                                  isSelected ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {city}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <p className="!font-bold">Style</p>
            <Popover
              open={stylePopoverOpen}
              onOpenChange={setStylePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  disabled={availableStyles.length === 0}
                >
                  {selectedStyles.length > 0
                    ? `${selectedStyles.length} selected`
                    : "Select styles"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
          </div>

          <div>
            <p className="!font-bold mb-1">Brackets</p>
            <div className="flex flex-row gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={finalsOnly}
                  onCheckedChange={(checked) => setFinalsOnly(checked === true)}
                />
                <span>Finals only</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={noPrelims}
                  onCheckedChange={(checked) => setNoPrelims(checked === true)}
                />
                <span>No prelims</span>
              </label>
            </div>
          </div>

          <div>
            <p className="!font-bold mb-1">Order</p>
            <div className="flex gap-2">
              <Label
                htmlFor="date-order-switch"
                className="font-bold cursor-pointer text-[13px]"
              >
                Oldest First
              </Label>
              <Switch
                id="date-order-switch"
                checked={sortOrder === "desc"}
                onCheckedChange={(checked) =>
                  setSortOrder(checked ? "desc" : "asc")
                }
              />
              <Label
                htmlFor="date-order-switch"
                className="font-bold cursor-pointer text-[13px]"
              >
                Newest First
              </Label>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 justify-end">
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="default" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
