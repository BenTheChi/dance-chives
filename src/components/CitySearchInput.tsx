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
import { Control, FieldPath, FieldValues, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";

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

interface CitySearchResponse {
  results: CitySearchItem[];
  fromNeo4j: CitySearchItem[];
  fromGoogle?: CitySearchItem[];
  hasMore: boolean;
}

async function getCitySearchItems(
  keyword: string,
  includeGoogle: boolean = false
): Promise<CitySearchResponse> {
  const url = `/api/cities/search?keyword=${encodeURIComponent(keyword)}${
    includeGoogle ? "&includeGoogle=true" : ""
  }`;

  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to fetch cities", response.statusText);
        return {
          results: [],
          fromNeo4j: [],
          hasMore: false,
        };
      }
      return response.json();
    })
    .catch((error) => {
      console.error(error);
      return {
        results: [],
        fromNeo4j: [],
        hasMore: false,
      };
    });
}

function getDisplayValue(city: City | CitySearchItem): string {
  if (!city.name || !city.region) return "";
  return `${city.name}, ${city.region}`;
}

function normalizeCity(
  city:
    | City
    | CitySearchItem
    | (City & Partial<CitySearchItem>)
    | string
    | null
    | undefined
): City | null {
  if (!city) return null;

  const parsed =
    typeof city === "string"
      ? (() => {
          try {
            return JSON.parse(city);
          } catch {
            return null;
          }
        })()
      : city;

  if (!parsed) return null;

  return {
    id: String(parsed.id),
    name: parsed.name,
    region: parsed.region,
    countryCode: parsed.countryCode,
    timezone: "timezone" in parsed ? parsed.timezone : undefined,
    latitude: "latitude" in parsed ? parsed.latitude : undefined,
    longitude: "longitude" in parsed ? parsed.longitude : undefined,
  };
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
  const [inputValue, setInputValue] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [items, setItems] = useState<CitySearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const fieldValue = useWatch({ control, name });

  const debouncedValue = useDebounce(inputValue, 300);

  // Sync the local state with either the externally supplied value prop or the form state
  useEffect(() => {
    const sourceCity =
      value !== undefined
        ? value
        : (fieldValue as City | CitySearchItem | string | null | undefined);
    const normalized = normalizeCity(sourceCity);

    if (!normalized) {
      if (sourceCity === null) {
        setSelectedCity((prev) => (prev ? null : prev));
      }
      return;
    }

    setSelectedCity((prev) => (prev?.id === normalized.id ? prev : normalized));

    const displayValue = getDisplayValue(normalized);
    setInputValue((prev) => (prev === displayValue ? prev : displayValue));
  }, [value, fieldValue]);

  // Fetch cities when debounced value changes - Neo4j first
  useEffect(() => {
    const fetchCities = async () => {
      if (debouncedValue.trim()) {
        setIsLoading(true);
        setIsLoadingGoogle(false);
        try {
          // Search Neo4j first (fast, free, no API calls)
          const response = await getCitySearchItems(debouncedValue, false);
          setItems(response.results);
          setHasMore(response.hasMore);

          // If Neo4j returned 0 results, auto-search Google Places
          if (response.results.length === 0) {
            setIsLoadingGoogle(true);
            const googleResponse = await getCitySearchItems(
              debouncedValue,
              true
            );
            setItems(googleResponse.results);
            setHasMore(false);
            setIsLoadingGoogle(false);
          }
        } catch (error) {
          console.error("Error fetching cities:", error);
          setItems([]);
          setHasMore(false);
        } finally {
          setIsLoading(false);
          setIsLoadingGoogle(false);
        }
      } else {
        setItems([]);
        setHasMore(false);
      }
    };

    fetchCities();
  }, [debouncedValue]);

  // Handle "Find More" button click
  const handleFindMore = async () => {
    if (!debouncedValue.trim()) return;

    setIsLoadingGoogle(true);
    try {
      const response = await getCitySearchItems(debouncedValue, true);
      setItems(response.results);
      setHasMore(false);
    } catch (error) {
      console.error("Error fetching more cities:", error);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleSelect = (cityItem: CitySearchItem): City => {
    // Convert CitySearchItem to City
    const city: City = {
      id: cityItem.id,
      name: cityItem.name,
      region: cityItem.region,
      countryCode: cityItem.countryCode,
    };

    setSelectedCity(city);
    setInputValue(getDisplayValue(city));
    setOpen(false);
    if (onChange) {
      onChange(city);
    }

    return city;
  };

  return (
    <div className={cn("relative w-full", className)}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel required={required}>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center border rounded-sm bg-white">
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
                  {isLoading || isLoadingGoogle ? (
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                  ) : (
                    <ChevronsUpDown
                      className="mr-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer"
                      onClick={() => setOpen(!open)}
                    />
                  )}
                  {open && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-sm shadow-lg z-50">
                      <Command className="bg-white">
                        <CommandList>
                          <CommandGroup>
                            {items.length === 0 &&
                            !isLoading &&
                            !isLoadingGoogle ? (
                              <CommandEmpty>No results found.</CommandEmpty>
                            ) : isLoading || isLoadingGoogle ? (
                              <CommandEmpty>
                                {isLoadingGoogle
                                  ? "Searching Google Places..."
                                  : "Searching..."}
                              </CommandEmpty>
                            ) : (
                              <>
                                {items.map((item) => (
                                  <CommandItem
                                    key={item.id}
                                    onSelect={async () => {
                                      const city = await handleSelect(item);
                                      field.onChange(city);
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
                                ))}
                                {hasMore && !isLoadingGoogle && (
                                  <CommandItem
                                    onSelect={handleFindMore}
                                    className="text-muted-foreground cursor-pointer"
                                  >
                                    <span className="ml-2">
                                      🔍 Find More Cities...
                                    </span>
                                  </CommandItem>
                                )}
                              </>
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
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
