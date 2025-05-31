"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface DebouncedSearchMultiSelectProps<T> {
  onSearch: (query: string) => Promise<T[]>;
  placeholder?: string;
  getDisplayValue: (item: T) => string;
  getItemId: (item: T) => string;
  onChange: (values: T[]) => void;
  value: T[];
  name: string;
  className?: string;
}

export function DebouncedSearchMultiSelect<T>({
  onSearch,
  placeholder = "Search...",
  getDisplayValue,
  getItemId,
  onChange,
  value,
  name,
  className,
}: DebouncedSearchMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery) {
        setLoading(true);
        try {
          const results = await onSearch(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, onSearch]);

  const handleSelect = (item: T) => {
    const isSelected = value.some((v) => getItemId(v) === getItemId(item));
    if (isSelected) {
      onChange(value.filter((v) => getItemId(v) !== getItemId(item)));
    } else {
      onChange([...value, item]);
    }
    setSearchQuery("");
  };

  const removeItem = (itemId: string) => {
    onChange(value.filter((v) => getItemId(v) !== itemId));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-1">
        {value.map((item) => (
          <Badge
            key={getItemId(item)}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {getDisplayValue(item)}
            <X
              className="w-3 h-3 cursor-pointer"
              onClick={() => removeItem(getItemId(item))}
            />
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>
              {loading ? "Searching..." : "No results found."}
            </CommandEmpty>
            <CommandGroup>
              {searchResults.map((item) => {
                const isSelected = value.some(
                  (v) => getItemId(v) === getItemId(item)
                );
                return (
                  <CommandItem
                    key={getItemId(item)}
                    onSelect={() => handleSelect(item)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {getDisplayValue(item)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
