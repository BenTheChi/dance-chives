"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
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
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormField } from "./ui/form";
import { FormLabel } from "./ui/form";
import { FormControl } from "./ui/form";
import { FormItem } from "./ui/form";
type SearchItem =
  | CitySearchItem
  | UserSearchItem
  | { id: string; title: string };

interface DebouncedSearchSelectProps<
  T extends SearchItem,
  TFormValues extends FieldValues = FieldValues
> {
  control: Control<TFormValues>;
  label: string | React.ReactNode;
  value?: T | null;
  defaultValue?: T;
  onChange?: (value: T | null) => void;
  onSearch: (keyword: string) => Promise<T[]>;
  placeholder?: string;
  debounceDelay?: number;
  name: FieldPath<TFormValues>;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  getDisplayValue: (item: T) => string;
  getItemId: (item: T) => string | number;
}

function DebouncedSearchSelect<
  T extends SearchItem,
  TFormValues extends FieldValues = FieldValues
>(props: DebouncedSearchSelectProps<T, TFormValues>) {
  const {
    control,
    value,
    defaultValue,
    label,
    name,
    onChange,
    onSearch,
    placeholder = "Search...",
    debounceDelay = 300,
    disabled = false,
    required = false,
    className,
    getDisplayValue,
    getItemId,
  } = props;

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() => {
    if (value) {
      return getDisplayValue(value);
    }
    return "";
  });
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const prevValueRef = useRef(value);

  const debouncedValue = useDebounce(inputValue, debounceDelay);

  // Initialize with defaultValue or value
  useEffect(() => {
    if (defaultValue && !value && !selectedItem) {
      setInputValue(getDisplayValue(defaultValue));
      setSelectedItem(defaultValue);
    }
  }, [defaultValue, value, selectedItem, getDisplayValue]);

  // Handle controlled component updates - only when value prop changes externally
  useEffect(() => {
    // Don't update if user is currently typing
    if (isUserTyping) {
      return;
    }

    // Only update if value prop actually changed (not on every render)
    const valueChanged =
      prevValueRef.current !== value &&
      (prevValueRef.current === null ||
        prevValueRef.current === undefined ||
        value === null ||
        value === undefined ||
        (prevValueRef.current &&
          value &&
          getItemId(prevValueRef.current) !== getItemId(value)));

    if (!valueChanged) {
      prevValueRef.current = value;
      return;
    }

    // Value changed externally, update the input
    if (value === null || value === undefined) {
      setInputValue("");
      setSelectedItem(null);
    } else {
      // If we have items, find the matching one
      const matchingItem = items.find(
        (item) => getItemId(item) === getItemId(value)
      );
      if (matchingItem) {
        setSelectedItem(matchingItem);
        setInputValue(getDisplayValue(matchingItem));
      } else {
        // Value changed but item not in list yet, update display value
        setInputValue(getDisplayValue(value));
      }
    }

    prevValueRef.current = value;
  }, [value, items, getItemId, getDisplayValue, isUserTyping]);

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

  return (
    <div className={cn("relative w-full", className)}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => {
          const handleSelect = (item: T) => {
            setSelectedItem(item);
            setInputValue(getDisplayValue(item));
            setOpen(false);
            // Always call field.onChange to keep react-hook-form in sync
            field.onChange(item);
            // Also call onChange prop if provided for additional parent logic
            if (onChange) {
              onChange(item);
            }
          };

          return (
            <FormItem>
              <FormLabel>
                {label}
                {required && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <div className="flex items-center border rounded-sm bg-neutral-300">
                  <div className="flex items-center w-full">
                    <Search className="ml-2 h-4 w-4 shrink-0 text-black" />
                    <Input
                      {...field}
                      placeholder={placeholder}
                      value={inputValue}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setIsUserTyping(true);
                        setInputValue(newValue);
                        setOpen(true);

                        // Clear selected item when user types something different
                        if (
                          selectedItem &&
                          newValue !== getDisplayValue(selectedItem)
                        ) {
                          setSelectedItem(null);
                        }

                        // Update form field when typing
                        if (!onChange) {
                          field.onChange(newValue);
                        }

                        // If user has cleared selection or changed from selected item, set to null
                        if (
                          selectedItem &&
                          newValue !== getDisplayValue(selectedItem)
                        ) {
                          // Always call field.onChange to keep react-hook-form in sync
                          field.onChange(null);
                          if (onChange) {
                            onChange(null);
                          }
                        }
                      }}
                      onBlur={() => {
                        // Reset typing flag after a short delay to allow value updates
                        setTimeout(() => {
                          setIsUserTyping(false);
                        }, 100);
                      }}
                      className="border-0 p-2 shadow-none focus-visible:ring-0 flex-1 bg-neutral-300"
                      disabled={disabled}
                    />
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                    ) : (
                      <ChevronsUpDown
                        className="mr-2 h-4 w-4 shrink-0 text-black cursor-pointer"
                        onClick={() => setOpen(!open)}
                      />
                    )}
                    {open && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-300 border rounded-sm shadow-lg z-50">
                        <Command className="bg-neutral-300">
                          <CommandList>
                            <CommandGroup>
                              {items.length === 0 && !isLoading ? (
                                <CommandEmpty>No results found.</CommandEmpty>
                              ) : (
                                items.map((item) => (
                                  <CommandItem
                                    key={getItemId(item)}
                                    onSelect={() => {
                                      handleSelect(item);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedItem &&
                                          getItemId(selectedItem) ===
                                            getItemId(item)
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
                      value={selectedItem ? JSON.stringify(selectedItem) : ""}
                      required={required}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </FormControl>
            </FormItem>
          );
        }}
      />
    </div>
  );
}

export { DebouncedSearchSelect };
