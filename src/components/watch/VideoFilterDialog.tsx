"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import { useSession } from "next-auth/react";
import { VideoFilters } from "@/types/video-filter";
import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";

interface VideoFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: VideoFilters;
  defaultFilters?: VideoFilters;
  availableCities: string[];
  availableStyles: string[];
  onApply: (filters: VideoFilters) => void;
  onSave?: (filters: VideoFilters) => void;
  onClear: () => void;
  isSaving?: boolean;
}

const fourDigitPattern = /^\d{4}$/;
type TextSelectionItem = {
  id: string;
  displayName: string;
  username: string;
  isUserItem?: boolean;
};

const toSelectionItem = (value: string): TextSelectionItem => ({
  id: value,
  displayName: value,
  username: value,
  isUserItem: false,
});

export function VideoFilterDialog({
  isOpen,
  onClose,
  filters,
  defaultFilters,
  availableCities,
  availableStyles,
  onApply,
  onSave,
  onClear,
  isSaving = false,
}: VideoFilterDialogProps) {
  const { data: session } = useSession();
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

  const citySearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) {
        return [];
      }
      return availableCities
        .filter((city) => city.toLowerCase().includes(trimmed))
        .map(toSelectionItem);
    },
    [availableCities]
  );

  const styleSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) {
        return [];
      }
      return availableStyles
        .filter((style) => style.toLowerCase().includes(trimmed))
        .map(toSelectionItem);
    },
    [availableStyles]
  );

  const selectedCityItems = useMemo(
    () => selectedCities.map(toSelectionItem),
    [selectedCities]
  );

  const selectedStyleItems = useMemo(
    () => selectedStyles.map(toSelectionItem),
    [selectedStyles]
  );

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

  const handleSave = () => {
    if (!validateYears()) {
      return;
    }
    onSave?.(selectedFilters);
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
            <DebouncedSearchMultiSelect
              onSearch={citySearch}
              placeholder="Search cities..."
              value={selectedCityItems}
              onChange={(items) =>
                setSelectedCities(items.map((item) => item.displayName))
              }
              name="cities"
              getDisplayValue={(item) => item.displayName}
              getItemId={(item) => item.id}
              disabled={availableCities.length === 0}
            />
          </div>

          <div>
            <p className="!font-bold">Style</p>
            <DebouncedSearchMultiSelect
              onSearch={styleSearch}
              placeholder="Search styles..."
              value={selectedStyleItems}
              onChange={(items) =>
                setSelectedStyles(items.map((item) => item.displayName))
              }
              name="styles"
              getDisplayValue={(item) => item.displayName}
              getItemId={(item) => item.id}
              disabled={availableStyles.length === 0}
            />
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
          {session?.user?.id && (
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
          <Button variant="default" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
