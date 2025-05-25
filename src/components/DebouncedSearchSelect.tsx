"use client";

import { useState, useEffect, forwardRef } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Input } from "@/components/ui/input";
import { UserSearchItem } from "@/types/user";
import { CitySearchItem } from "@/types/city";

type SearchItem = CitySearchItem | UserSearchItem;

interface DebouncedSearchSelectProps<T extends SearchItem> {
  value?: T | null;
  defaultValue?: T;
  onChange?: (value: T | null) => void;
  onSearch: (keyword: string) => Promise<T[]>;
  placeholder?: string;
  debounceDelay?: number;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  getDisplayValue: (item: T) => string;
  getItemId: (item: T) => string | number;
}

const DebouncedSearchSelect = forwardRef(function DebouncedSearchSelect<
  T extends SearchItem
>(
  props: DebouncedSearchSelectProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {
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
    getDisplayValue,
    getItemId,
  } = props;

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedValue = useDebounce(inputValue, debounceDelay);

  // Initialize with defaultValue or value
  useEffect(() => {
    if (defaultValue && !value && !selectedItem) {
      setInputValue(getDisplayValue(defaultValue));
    }
  }, [defaultValue, value, selectedItem, getDisplayValue]);

  // Handle controlled component updates
  useEffect(() => {
    if (
      value !== undefined &&
      value !== null &&
      (!selectedItem || getItemId(selectedItem) !== getItemId(value))
    ) {
      // If we have items, find the matching one
      const matchingItem = items.find(
        (item) => getItemId(item) === getItemId(value)
      );
      if (matchingItem) {
        setSelectedItem(matchingItem);
        setInputValue(getDisplayValue(matchingItem));
      }
    }
  }, [value, items, selectedItem, getItemId, getDisplayValue]);

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

  const handleSelect = (item: T) => {
    setSelectedItem(item);
    setInputValue(getDisplayValue(item));
    setOpen(false);
    if (onChange) {
      onChange(item);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {name && (
        <label className="text-sm font-medium mb-1.5 block">
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </label>
      )}
      <div className="flex items-center border rounded-md bg-white">
        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
            if (
              selectedItem &&
              e.target.value !== getDisplayValue(selectedItem)
            ) {
              setSelectedItem(null);
              if (onChange) onChange(null);
            }
          }}
          className="border-0 p-2 shadow-none focus-visible:ring-0 flex-1 bg-white"
          disabled={disabled}
          name={name}
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
                {items.length === 0 && !isLoading ? (
                  <CommandEmpty>No results found.</CommandEmpty>
                ) : (
                  items.map((item) => (
                    <CommandItem
                      key={getItemId(item)}
                      onSelect={() => handleSelect(item)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedItem &&
                            getItemId(selectedItem) === getItemId(item)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {getDisplayValue(item)}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedItem ? JSON.stringify(selectedItem) : ""}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}) as <T extends SearchItem>(
  props: DebouncedSearchSelectProps<T> & { ref?: React.Ref<HTMLButtonElement> }
) => React.ReactElement;

export { DebouncedSearchSelect };
