"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface SearchItem {
  id?: string; // Optional - only present when coming from server data
  displayName: string;
  username: string;
}

interface DebouncedSearchMultiSelectProps<T extends SearchItem> {
  onSearch: (query: string) => Promise<T[]>;
  placeholder?: string;
  onChange: (values: T[]) => void;
  value: T[];
  name: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  debounceDelay?: number;
  getDisplayValue: (item: T) => string;
  getItemId: (item: T) => string;
}

function DebouncedSearchMultiSelect<T extends SearchItem>(
  props: DebouncedSearchMultiSelectProps<T>
) {
  const {
    onSearch,
    placeholder = "Search...",
    onChange,
    value,
    name,
    className,
    disabled = false,
    required = false,
    debounceDelay = 300,
    getDisplayValue,
    getItemId,
  } = props;
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedValue = useDebounce(inputValue, debounceDelay);

  // Deduplicate value array based on getItemId to prevent duplicate keys
  // This ensures we never render duplicate items even if parent passes duplicates
  const deduplicatedValue = useMemo(() => {
    const seen = new Map<string, T>();
    value.forEach((item) => {
      const itemId = getItemId(item);
      // Only keep the first occurrence of each item
      if (!seen.has(itemId)) {
        seen.set(itemId, item);
      }
    });
    return Array.from(seen.values());
  }, [value, getItemId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".debounced-search-multi-select")) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (debouncedValue.trim()) {
        setIsLoading(true);
        try {
          const results = await onSearch(debouncedValue);
          setSearchResults(results);
        } catch (error) {
          console.error("Error fetching items:", error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    fetchItems();
  }, [debouncedValue, onSearch]);

  const handleSelect = (item: T) => {
    const itemId = getItemId(item);
    const isSelected = deduplicatedValue.some((v) => getItemId(v) === itemId);
    if (isSelected) {
      onChange(deduplicatedValue.filter((v) => getItemId(v) !== itemId));
    } else {
      // Ensure we don't add duplicates - filter out any existing items with same ID
      const newValue = [...deduplicatedValue, item];
      const deduplicated = Array.from(
        new Map(newValue.map((v) => [getItemId(v), v])).values()
      );
      onChange(deduplicated);
    }
    setInputValue("");
  };

  const removeItem = (itemId: string) => {
    onChange(deduplicatedValue.filter((v) => getItemId(v) !== itemId));
  };

  return (
    <div
      className={cn("flex flex-col debounced-search-multi-select", className)}
    >
      {name && (
        <label className="text-sm font-medium block">
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </label>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {deduplicatedValue.map((item) => {
          const itemId = getItemId(item);
          // itemId is guaranteed to be unique after deduplication
          return (
            <Badge
              key={itemId}
              variant="secondary"
              className="flex items-center gap-1 hover:bg-secondary/80 transition-colors"
            >
              {getDisplayValue(item)}
              <button
                type="button"
                onClick={() => removeItem(itemId)}
                className="ml-1 hover:bg-secondary/90 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          );
        })}
      </div>
      <div className="relative w-full">
        <div className="flex items-center border rounded-md bg-white">
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            className="border-0 p-2 shadow-none focus-visible:ring-0 flex-1 bg-white"
            disabled={disabled}
          />
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown
              className="mr-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer"
              onClick={() => setOpen(!open)}
            />
          )}
        </div>
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <Command className="bg-white">
              <CommandList>
                <CommandGroup>
                  {searchResults.length === 0 && !isLoading ? (
                    <CommandEmpty>No results found.</CommandEmpty>
                  ) : (
                    searchResults.map((item, index) => {
                      const itemId = getItemId(item);
                      const isSelected = deduplicatedValue.some(
                        (v) => getItemId(v) === itemId
                      );
                      // Use itemId with index for search results since same item might appear in search results
                      // (though unlikely, index ensures uniqueness)
                      return (
                        <CommandItem
                          key={`${itemId}-search-${index}`}
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
                    })
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(deduplicatedValue)}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

export { DebouncedSearchMultiSelect };
