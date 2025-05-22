"use client";

import { useState, useEffect, forwardRef } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export type SearchItem = {
  value: string;
  label: string;
  sublabel?: string;
  abbr?: string;
  timezone?: string;
};

interface DebouncedSearchSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch: (keyword: string) => Promise<SearchItem[]>;
  placeholder?: string;
  debounceDelay?: number;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: boolean;
}

const DebouncedSearchSelect = forwardRef<
  HTMLButtonElement,
  DebouncedSearchSelectProps
>(
  (
    {
      value,
      defaultValue,
      onChange,
      onSearch,
      placeholder = "Search...",
      debounceDelay = 300,
      name,
      disabled = false,
      required = false,
      className,
      error = false,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
    const [items, setItems] = useState<SearchItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedValue = useDebounce(inputValue, debounceDelay);

    // Initialize with defaultValue or value
    useEffect(() => {
      if (defaultValue && !value && !selectedItem) {
        setInputValue(defaultValue);
      }
    }, [defaultValue, value, selectedItem]);

    // Handle controlled component updates
    useEffect(() => {
      if (
        value !== undefined &&
        (!selectedItem || selectedItem.value !== value)
      ) {
        // If we have items, find the matching one
        const matchingItem = items.find((item) => item.value === value);
        if (matchingItem) {
          setSelectedItem(matchingItem);
          setInputValue(matchingItem.label);
        }
      }
    }, [value, items, selectedItem]);

    // Fetch items when debounced value changes
    useEffect(() => {
      const fetchItems = async () => {
        if (debouncedValue.trim()) {
          setIsLoading(true);
          try {
            const results = await onSearch(debouncedValue);
            setItems(results);
          } catch (error) {
            console.error("Error fetching items:", error);
            setItems([]);
          } finally {
            setIsLoading(false);
          }
        } else {
          setItems([]);
        }
      };

      fetchItems();
    }, [debouncedValue, onSearch]);

    const handleSelect = (item: SearchItem) => {
      setSelectedItem(item);
      setInputValue(item.label);
      setOpen(false);
      if (onChange) {
        onChange(item.value);
      }
    };

    return (
      <div className={cn("relative w-full", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between",
                error ? "border-destructive" : "",
                !selectedItem && "text-muted-foreground"
              )}
              disabled={disabled}
              onClick={() => setOpen(!open)}
              type="button"
              name={name}
            >
              <div className="flex items-center">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                {selectedItem ? selectedItem.label : placeholder}
              </div>
              {isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[var(--radix-popover-trigger-width)]"
            align="start"
          >
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (selectedItem && e.target.value !== selectedItem.label) {
                    setSelectedItem(null);
                    if (onChange) onChange("");
                  }
                }}
                className="border-0 p-1 shadow-none focus-visible:ring-0"
              />
            </div>
            <Command>
              <CommandList>
                <CommandGroup>
                  {items.length === 0 && !isLoading ? (
                    <CommandEmpty>No results found.</CommandEmpty>
                  ) : (
                    items.map((item) => (
                      <CommandItem
                        key={item.value}
                        onSelect={() => handleSelect(item)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedItem?.value === item.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {item.label}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* Hidden input for form submission */}
        <input
          type="hidden"
          name={name}
          value={selectedItem?.value || ""}
          required={required}
          disabled={disabled}
        />
      </div>
    );
  }
);

DebouncedSearchSelect.displayName = "DebouncedSearchSelect";

export { DebouncedSearchSelect };
