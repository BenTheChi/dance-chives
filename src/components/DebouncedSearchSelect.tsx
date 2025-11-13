"use client";

import { useState, useEffect } from "react";
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
  label: string;
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
  const [inputValue, setInputValue] = useState(
    value ? getDisplayValue(value) : ""
  );
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedValue = useDebounce(inputValue, debounceDelay);

  // Initialize with defaultValue or value
  useEffect(() => {
    if (defaultValue && !value && !selectedItem) {
      setInputValue(getDisplayValue(defaultValue));
      setSelectedItem(defaultValue);
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
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <div className="flex items-center border rounded-md bg-white">
                  <div className="flex items-center w-full">
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      {...field}
                      placeholder={placeholder}
                      value={inputValue}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setInputValue(newValue);
                        setOpen(true);
                        // Update form field when typing
                        if (!onChange) {
                          field.onChange(newValue);
                        }

                        if (
                          selectedItem &&
                          newValue !== getDisplayValue(selectedItem)
                        ) {
                          setSelectedItem(null);
                          // Always call field.onChange to keep react-hook-form in sync
                          field.onChange(null);
                          if (onChange) {
                            onChange(null);
                          }
                        }
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
                    {open && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-50">
                        <Command className="bg-white">
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
