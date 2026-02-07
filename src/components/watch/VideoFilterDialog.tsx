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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
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
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false);
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
      <DialogContent className="!max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            Filters
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {/* Row 1: From, To */}
          <div className="flex flex-col gap-1">
            <Label
              htmlFor={yearFromInputId}
              className="font-bold text-muted-foreground text-lg"
            >
              From
            </Label>
            <Input
              id={yearFromInputId}
              placeholder="YYYY"
              value={yearFromText}
              onChange={(event) => setYearFromText(event.target.value)}
              maxLength={4}
              className="w-full bg-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label
              htmlFor={yearToInputId}
              className="font-bold text-muted-foreground text-lg"
            >
              To
            </Label>
            <Input
              id={yearToInputId}
              placeholder="YYYY"
              value={yearToText}
              onChange={(event) => setYearToText(event.target.value)}
              maxLength={4}
              className="w-full bg-muted-foreground"
            />
          </div>
          {yearError && (
            <p className="col-span-2 text-xs text-destructive-foreground">
              {yearError}
            </p>
          )}

          {/* Row 2: City, Style */}
          <div className="flex flex-col gap-1">
            <p className="!font-bold">City</p>
            <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
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
                className="z-[110] w-full max-w-[320px] p-0"
                align="start"
              >
                <div className="max-h-[280px] overflow-auto p-1">
                  {availableCities.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No cities
                    </p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {availableCities.map((city) => (
                        <label
                          key={city}
                          className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={selectedCities.includes(city)}
                            onCheckedChange={() => toggleCity(city)}
                          />
                          <span className="!text-sm">{city}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-1">
            <p className="!font-bold">Style</p>
            <Popover open={stylePopoverOpen} onOpenChange={setStylePopoverOpen}>
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
                className="z-[110] w-full max-w-[320px] p-0"
                align="start"
              >
                <div className="max-h-[280px] overflow-auto p-1">
                  {availableStyles.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No styles
                    </p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {availableStyles.map((style) => (
                        <label
                          key={style}
                          className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={selectedStyles.includes(style)}
                            onCheckedChange={() => toggleStyle(style)}
                          />
                          <span className="!text-sm">
                            {formatStyleNameForDisplay(style)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Row 3: Brackets + Finals only + No prelims */}
          <div className="col-span-2 flex flex-col gap-1">
            <p className="!font-bold">Brackets</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={finalsOnly}
                  onCheckedChange={(checked) => setFinalsOnly(checked === true)}
                  className="bg-muted-foreground border-1"
                />
                <span>Finals only</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={noPrelims}
                  onCheckedChange={(checked) => setNoPrelims(checked === true)}
                  className="bg-muted-foreground border-none"
                />
                <span>No prelims</span>
              </label>
            </div>
          </div>

          {/* Row 4: Order + Oldest / Newest switch */}
          <div className="col-span-2 flex flex-col gap-1">
            <p className="!font-bold">Order</p>
            <div className="flex flex-wrap items-center gap-2">
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
