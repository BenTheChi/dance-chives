"use client";

import { useState, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserSearchItem } from "@/types/user";

interface SearchItem {
  id: string;
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

const DebouncedSearchMultiSelect = forwardRef(
  function DebouncedSearchMultiSelect<T extends SearchItem>(
    {
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
    }: DebouncedSearchMultiSelectProps<T>,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [searchResults, setSearchResults] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedValue = useDebounce(inputValue, debounceDelay);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest(".debounced-search-multi-select")) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
      const isSelected = value.some((v) => v.id === item.id);
      if (isSelected) {
        onChange(value.filter((v) => v.id !== item.id));
      } else {
        onChange([...value, item]);
      }
      setInputValue("");
    };

    const removeItem = (itemId: string) => {
      onChange(value.filter((v) => v.id !== itemId));
    };

    return (
      <div
        className={cn(
          "flex flex-col gap-2 debounced-search-multi-select",
          className
        )}
      >
        {name && (
          <label className="text-sm font-medium mb-1.5 block">
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </label>
        )}
        <div className="flex flex-wrap gap-1">
          {value.map((item) => (
            <Badge
              key={getItemId(item)}
              variant="secondary"
              className="flex items-center gap-1 hover:bg-secondary/80 transition-colors"
            >
              {getDisplayValue(item)}
              <button
                type="button"
                onClick={() => removeItem(getItemId(item))}
                className="ml-1 hover:bg-secondary/90 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
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
                      searchResults.map((item) => {
                        const isSelected = value.some((v) => v.id === item.id);
                        return (
                          <CommandItem
                            key={item.id}
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
          value={JSON.stringify(value)}
          required={required}
          disabled={disabled}
        />
      </div>
    );
  }
) as <T extends SearchItem>(
  props: DebouncedSearchMultiSelectProps<T> & {
    ref?: React.Ref<HTMLButtonElement>;
  }
) => React.ReactElement;

export { DebouncedSearchMultiSelect };
