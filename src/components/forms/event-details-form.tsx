"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import {
  Control,
  FieldPath,
  UseFormSetValue,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { FormValues } from "./event-form";
import { EventDetails } from "@/types/event";
import { Image } from "@/types/image";
import { City, CitySearchItem } from "@/types/city";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
} from "../ui/form";
import { Input, InstagramInput } from "../ui/input";
import { DebouncedSearchSelect } from "../DebouncedSearchSelect";
import { PosterUpload } from "../ui/poster-upload";
import { DatePicker } from "../ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import {
  PlusIcon,
  MinusIcon,
  Globe,
  Instagram,
  Youtube,
  Facebook,
} from "lucide-react";
import { StyleMultiSelect } from "../ui/style-multi-select";
import { Switch } from "../ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { Wand2 } from "lucide-react";

interface EventDetailsFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  eventDetails: EventDetails;
  onAutofill?: (data: any, posterFile: File | null) => void;
  // Props for managing autofill job state from parent
  parentAutofillJobId?: string | null;
  parentIsAutofilling?: boolean;
  onAutofillJobStart?: (jobId: string, posterFile: File | null) => void;
}

interface CitySearchResponse {
  results: CitySearchItem[];
  fromNeo4j: CitySearchItem[];
  fromGoogle?: CitySearchItem[];
  hasMore: boolean;
}

async function getCitySearchItems(keyword: string): Promise<CitySearchItem[]> {
  // Search Neo4j first (fast, free, no API calls)
  const url = `/api/cities/search?keyword=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to fetch cities", response.statusText);
      return [];
    }

    const data: CitySearchResponse = await response.json();

    // If Neo4j returned results, return them
    if (data.results.length > 0) {
      return data.results;
    }

    // If Neo4j returned 0 results, auto-search Google Places
    const googleUrl = `/api/cities/search?keyword=${encodeURIComponent(
      keyword
    )}&includeGoogle=true`;
    const googleResponse = await fetch(googleUrl);
    if (!googleResponse.ok) {
      return [];
    }

    const googleData: CitySearchResponse = await googleResponse.json();
    return googleData.results;
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
}

export function EventDetailsForm({
  control,
  setValue,
  eventDetails,
  onAutofill,
  parentAutofillJobId,
  parentIsAutofilling,
  onAutofillJobStart,
}: EventDetailsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "eventDetails.dates",
  });
  const hasInitialized = useRef(false);
  const dates = useWatch({ control, name: "eventDetails.dates" });

  // Autofill state
  const [autofillPoster, setAutofillPoster] = useState<File | null>(null);
  const [autofillText, setAutofillText] = useState("");
  const [autofillError, setAutofillError] = useState<string | null>(null);

  // Use parent's loading state if available, otherwise use local state
  const isAutofilling = parentIsAutofilling ?? false;

  const handleAutofill = async () => {
    if (!autofillPoster && !autofillText.trim()) {
      toast.error("Please upload a poster image or enter text");
      return;
    }

    setAutofillError(null);

    try {
      const formData = new FormData();
      if (autofillPoster) {
        formData.append("poster", autofillPoster);
      }
      if (autofillText.trim()) {
        formData.append("text", autofillText);
      }

      const response = await fetch("/api/events/autofill/start", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start autofill");
      }

      const result = await response.json();

      if (result.success && result.jobId) {
        // Notify parent to start polling (polling happens at parent level)
        if (onAutofillJobStart) {
          onAutofillJobStart(result.jobId, autofillPoster);
        }
        toast.info("Autofill started! Processing in the background...");
        // Clear the autofill inputs after starting
        setAutofillPoster(null);
        setAutofillText("");
      } else {
        throw new Error("Invalid response from autofill API");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start autofill";
      setAutofillError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Always initialize with one date entry if empty
  useEffect(() => {
    if (!hasInitialized.current) {
      if (fields.length === 0) {
        // Ensure at least one date entry exists
        append({
          date: "",
          isAllDay: true,
          startTime: undefined,
          endTime: undefined,
        });
      }
      hasInitialized.current = true;
    }
  }, [fields.length, append]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* AI Autofill Section */}
      {onAutofill && (
        <div className="bg-primary space-y-5 border-2 border-black rounded-sm p-5">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            <h3 className="mb-0">AI Autofill</h3>
          </div>
          <p className="text-sm">
            Upload a poster image and/or paste text from the event post
            (Instagram/Facebook) to automatically fill in event details. You can
            use text-only mode if you don't have a poster image.
          </p>

          <div className="space-y-4">
            {/* Poster Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Poster Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setAutofillPoster(file);
                  setAutofillError(null);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-accent-blue file:text-black hover:file:bg-accent-blue/90 file:cursor-pointer bg-neutral-300 p-2 rounded-sm border border-charcoal"
              />
              {autofillPoster && (
                <p className="text-xs text-gray-600 mt-1">
                  Selected: {autofillPoster.name}
                </p>
              )}
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Post Text{" "}
                {!autofillPoster && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                value={autofillText}
                onChange={(e) => {
                  setAutofillText(e.target.value);
                  setAutofillError(null);
                }}
                placeholder="Paste text from Instagram/Facebook post here..."
                className="bg-neutral-300 min-h-[100px] resize-y"
              />
            </div>

            {/* Error Message */}
            {autofillError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                {autofillError}
              </div>
            )}

            {/* Autofill Button */}
            <Button
              onClick={handleAutofill}
              disabled={(!autofillPoster && !autofillText.trim()) || isAutofilling}
              className="w-full sm:w-auto"
              type="button"
            >
              {isAutofilling ? (
                <>
                  <span className="mr-2">Processing...</span>
                  <span className="animate-spin">⏳</span>
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Autofill with AI
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="bg-primary space-y-5 border-2 border-black rounded-sm p-5">
        <div>
          <h3 className="mb-4">Basic Information</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 w-full">
          {/* Event Title - Full Width */}
          <FormField
            control={control}
            name="eventDetails.title"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0 w-full">
                <FormLabel>
                  Event Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="bg-neutral-300 w-full"
                    placeholder="e.g., Summer Dance Battle 2024"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="eventDetails.eventType"
            render={({ field }) => {
              const value = field.value || "Battle";
              return (
                <FormItem className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[250px] min-w-0">
                  <FormLabel>
                    Event Type <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(newValue) => {
                      field.onChange(newValue);
                    }}
                    value={value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-neutral-300 w-full min-w-0">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Battle">Battle</SelectItem>
                      <SelectItem value="Class">Class</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Party">Party</SelectItem>
                      <SelectItem value="Performance">Performance</SelectItem>
                      <SelectItem value="Session">Session</SelectItem>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        {/* Event and Styles */}
        <FormField
          control={control}
          name="eventDetails.styles"
          render={({ field }) => (
            <FormItem className="flex-1 min-w-0 w-full">
              <FormLabel>Dance Styles</FormLabel>
              <FormControl>
                <StyleMultiSelect
                  value={field.value ?? []}
                  onChange={(styles) => {
                    field.onChange(styles);
                    setValue("eventDetails.styles", styles, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                  placeholder="Select dance styles..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Social Media Links - Website, Instagram, YouTube, Facebook */}
        <div className="grid grid-cols-2 gap-5 w-full">
          <FormField
            control={control}
            name="eventDetails.website"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0 w-full">
                <FormLabel className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="bg-neutral-300 w-full"
                    placeholder="https://example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="eventDetails.instagram"
            render={({ field }) => {
              // Extract username from URL if it's a full URL, otherwise use as-is
              const getUsernameFromValue = (
                val: string | undefined
              ): string => {
                if (!val) return "";
                // If it's a URL, extract the username
                if (val.includes("instagram.com/")) {
                  const match = val.match(/instagram\.com\/([^/?]+)/);
                  return match ? match[1] : val.replace(/^@/, "");
                }
                // Otherwise, remove @ if present
                return val.replace(/^@/, "");
              };

              return (
                <FormItem className="flex-1 min-w-0 w-full">
                  <FormLabel className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </FormLabel>
                  <FormControl>
                    <InstagramInput
                      {...field}
                      value={getUsernameFromValue(field.value)}
                      onChange={(e) => {
                        // The normalizeInstagram function will handle converting username to URL
                        field.onChange(e.target.value);
                      }}
                      className="bg-neutral-300 w-full"
                      placeholder="username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={control}
            name="eventDetails.youtube"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0 w-full">
                <FormLabel className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="bg-neutral-300 w-full"
                    placeholder="@username or link"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="eventDetails.facebook"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0 w-full">
                <FormLabel className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="bg-neutral-300 w-full"
                    placeholder="@username or link"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Location & Date Section */}
      <div className="bg-primary space-y-5 border-2 border-black rounded-sm p-5">
        <div>
          <h3 className="mb-4">When & Where</h3>
        </div>

        {/* City and Location */}
        <div className="flex flex-col sm:flex-row gap-5 w-full">
          <div className="flex-1 min-w-0 w-full">
            <DebouncedSearchSelect<CitySearchItem, FormValues>
              control={control}
              name="eventDetails.city"
              onSearch={getCitySearchItems}
              placeholder="Search for a city..."
              getDisplayValue={(item: CitySearchItem) => {
                if (!item.name || !item.region) return "";
                return item.name + ", " + item.region;
              }}
              getItemId={(item) => item.id}
              onChange={(value) => {
                setValue("eventDetails.city", value as City);
              }}
              value={eventDetails.city}
              label="City"
              required={true}
            />
          </div>
          <FormField
            control={control}
            name="eventDetails.location"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0 w-full">
                <FormLabel>Venue / Location</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="bg-neutral-300 w-full"
                    placeholder="e.g., Central Park, Studio 54"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Event Dates Section */}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-neutral-300 border border-charcoal rounded-sm p-4 sm:p-5 w-full overflow-hidden"
            >
              <div className="space-y-4">
                {/* Date and All Day Row */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                  <div className="flex-1 w-full sm:min-w-[200px] min-w-0">
                    <DatePicker
                      control={control as Control<FormValues>}
                      name={
                        `eventDetails.dates.${index}.date` as FieldPath<FormValues>
                      }
                      label="Date"
                      required={true}
                      labelClassName="text-black"
                    />
                  </div>

                  <div className="flex items-center gap-4 sm:pb-2">
                    <FormField
                      control={control}
                      name={`eventDetails.dates.${index}.isAllDay`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 space-y-0">
                          <FormLabel className="cursor-pointer whitespace-nowrap text-sm font-normal text-black">
                            All Day Event
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value ?? true}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  setValue(
                                    `eventDetails.dates.${index}.startTime`,
                                    undefined,
                                    { shouldValidate: true }
                                  );
                                  setValue(
                                    `eventDetails.dates.${index}.endTime`,
                                    undefined,
                                    { shouldValidate: true }
                                  );
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {fields.length > 1 && (
                      <Button
                        onClick={() => remove(index)}
                        variant="destructive"
                        size="icon"
                        className="rounded-full"
                        type="button"
                        aria-label="Remove date"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Time Fields - Only show when not all-day */}
                {dates?.[index]?.isAllDay === false && (
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <div className="flex-1 w-full sm:max-w-[220px] min-w-0">
                      <FormField
                        control={control}
                        name={`eventDetails.dates.${index}.startTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">
                              Start Time
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                value={field.value ?? ""}
                                className="bg-neutral-300 w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex-1 w-full sm:max-w-[220px] min-w-0">
                      <FormField
                        control={control}
                        name={`eventDetails.dates.${index}.endTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">
                              End Time
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                value={field.value ?? ""}
                                className="bg-neutral-300 w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full sm:w-auto border-2 border-dashed hover:border-solid hover:bg-gray-50 text-black"
            onClick={() => {
              const lastEntry = dates?.[dates.length - 1];
              append({
                date: lastEntry?.date ?? "",
                isAllDay: lastEntry?.isAllDay ?? true,
                startTime: lastEntry?.startTime ?? undefined,
                endTime: lastEntry?.endTime ?? undefined,
              });
            }}
            type="button"
          >
            <PlusIcon className="mr-2 h-4 w-4 text-black" />
            Add Another Date
          </Button>
        </div>
      </div>

      {/* Event Poster Section */}
      <div className="bg-primary space-y-5 border-2 border-black rounded-sm p-5">
        <div>
          <h3 className="text-lg font-semibold">Event Poster</h3>
        </div>

        <FormField
          control={control}
          name="eventDetails.poster"
          render={() => (
            <FormItem>
              <FormControl>
                <PosterUpload
                  initialPoster={eventDetails.poster?.url || null}
                  initialPosterFile={eventDetails.poster?.file || null}
                  initialBgColor={eventDetails.bgColor || "#ffffff"}
                  onFileChange={({ file, bgColor }) => {
                    // Store bgColor in form state
                    setValue("eventDetails.bgColor", bgColor, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });

                    if (file) {
                      // Create Image object with the file
                      const posterImage: Image = {
                        id: eventDetails.poster?.id || crypto.randomUUID(),
                        title: eventDetails.poster?.title || "Poster",
                        url: eventDetails.poster?.url || "",
                        type: "poster",
                        file: file,
                      };

                      setValue("eventDetails.poster", posterImage, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    } else {
                      // If file is removed, clear the poster
                      setValue("eventDetails.poster", null, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }
                  }}
                  editable={true}
                  maxFiles={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Additional Details Section */}
      <div className="bg-primary space-y-5 border-2 border-black rounded-sm p-5">
        <div>
          <h3 className="mb-4">Additional Details</h3>
        </div>

        <FormField
          control={control}
          name="eventDetails.description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  value={field.value ?? ""}
                  className="bg-neutral-300 min-h-[120px] p-3 rounded-sm border border-charcoal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y w-full min-w-0 placeholder:text-charcoal text-black"
                  placeholder="Tell people about your event. What makes it special? Who should attend?"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="eventDetails.schedule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  value={field.value ?? ""}
                  className="bg-neutral-300 min-h-[120px] p-3 rounded-sm border border-charcoal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y w-full min-w-0 placeholder:text-charcoal text-black"
                  placeholder="Add a detailed schedule or timeline for your event..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row w-full gap-5">
          <FormField
            control={control}
            name="eventDetails.cost"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Cost</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="bg-neutral-300 w-full"
                    placeholder="e.g., $20, Free, $10-15"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="eventDetails.prize"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Prize</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="bg-neutral-300 w-full"
                    placeholder="e.g., $500, Trophy, Gift card"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
