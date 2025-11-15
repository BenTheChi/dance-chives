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
import { CitySearchItem, City } from "@/types/city";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "./ui/form";

interface CitySearchInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  value?: City | null;
  onChange?: (value: City | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

async function getCitySearchItems(keyword: string): Promise<CitySearchItem[]> {
  return fetch(`/api/geodb/places?keyword=${encodeURIComponent(keyword)}`)
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to fetch cities", response.statusText);
        return [];
      }
      return response.json();
    })
    .then((data) => {
      return data.data
        .map((city: CitySearchItem) => ({
          id: city.id,
          name: city.name,
          region: city.region,
          countryCode: city.countryCode,
          population: city.population,
        }))
        .reverse();
    })
    .catch((error) => {
      console.error(error);
      return [];
    });
}

function getDisplayValue(city: City | CitySearchItem): string {
  if (!city.name || !city.region) return "";
  return `${city.name}, ${city.region}`;
}

export function CitySearchInput<T extends FieldValues>({
  control,
  name,
  label = "City",
  value,
  onChange,
  placeholder = "Search for a city...",
  disabled = false,
  required = false,
  className,
}: CitySearchInputProps<T>) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    value ? getDisplayValue(value) : ""
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(value || null);
  const [items, setItems] = useState<CitySearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedValue = useDebounce(inputValue, 300);

  // Handle controlled component updates
  useEffect(() => {
    if (
      value !== undefined &&
      value !== null &&
      (!selectedCity || selectedCity.id !== value.id)
    ) {
      setSelectedCity(value);
      setInputValue(getDisplayValue(value));
    }
  }, [value, selectedCity]);

  // Fetch cities when debounced value changes
  useEffect(() => {
    const fetchCities = async () => {
      if (debouncedValue.trim()) {
        setIsLoading(true);
        try {
          const results = await getCitySearchItems(debouncedValue);
          setItems(results);
        } catch (error) {
          console.error("Error fetching cities:", error);
          setItems([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setItems([]);
      }
    };

    fetchCities();
  }, [debouncedValue]);

  const handleSelect = (cityItem: CitySearchItem) => {
    // Convert CitySearchItem to City (fetch timezone if needed)
    const city: City = {
      id: cityItem.id,
      name: cityItem.name,
      region: cityItem.region,
      countryCode: cityItem.countryCode,
      population: cityItem.population,
    };

    setSelectedCity(city);
    setInputValue(getDisplayValue(city));
    setOpen(false);
    if (onChange) {
      onChange(city);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center border rounded-md bg-white">
                <div className="flex items-center w-full">
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setInputValue(newValue);
                      setOpen(true);

                      if (
                        selectedCity &&
                        newValue !== getDisplayValue(selectedCity)
                      ) {
                        setSelectedCity(null);
                        if (onChange) onChange(null);
                        field.onChange(null);
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
                                  key={item.id}
                                  onSelect={() => {
                                    handleSelect(item);
                                    field.onChange(item);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCity &&
                                        selectedCity.id === item.id
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
                  {/* Hidden input for form submission with full city object */}
                  <input
                    type="hidden"
                    name={field.name}
                    value={selectedCity ? JSON.stringify(selectedCity) : ""}
                    required={required}
                    disabled={disabled}
                  />
                </div>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
