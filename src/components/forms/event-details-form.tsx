"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import {
  Control,
  FieldPath,
  UseFormRegister,
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
import { Input } from "../ui/input";
import { DebouncedSearchSelect } from "../DebouncedSearchSelect";
import UploadFile from "../ui/uploadfile";
import { DatePicker } from "../ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { PlusIcon, MinusIcon } from "lucide-react";
import { StyleMultiSelect } from "../ui/style-multi-select";
import { Switch } from "../ui/switch";

interface EventDetailsFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  eventDetails: EventDetails;
  register: UseFormRegister<FormValues>;
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

export function EventDetailsForm({
  control,
  setValue,
  eventDetails,
  register,
}: EventDetailsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "eventDetails.dates",
  });
  const hasInitialized = useRef(false);
  const dates = useWatch({ control, name: "eventDetails.dates" });

  // Always initialize with one date entry if empty
  useEffect(() => {
    if (!hasInitialized.current) {
      if (fields.length === 0) {
        // Initialize with one entry if empty
        append({
          date: "",
          isAllDay: true,
          startTime: undefined,
          endTime: undefined,
        });
        hasInitialized.current = true;
      } else if (fields.length > 1) {
        // If there are more than one entries on mount, reduce to one
        // Remove from the end, working backwards to avoid index issues
        for (let i = fields.length - 1; i > 0; i--) {
          remove(i);
        }
        hasInitialized.current = true;
      } else if (fields.length === 1) {
        // Already has exactly one entry, mark as initialized
        hasInitialized.current = true;
      }
    }
  }, [fields.length, append, remove]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* Basic Information Section */}
      <div className="space-y-5 border border-charcoal rounded-lg p-5 bg-white shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>
        </div>

        {/* Event Title - Full Width */}
        <FormField
          control={control}
          name="eventDetails.title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Event Title <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="bg-white"
                  placeholder="e.g., Summer Dance Battle 2024"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Event Type and Styles */}
        <div className="flex flex-col sm:flex-row gap-5 w-full">
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
                      <SelectTrigger className="bg-white w-full min-w-0">
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
        </div>
      </div>

      {/* Location & Date Section */}
      <div className="space-y-5 border border-charcoal rounded-lg p-5 bg-white shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            When & Where
          </h3>
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
                    className="bg-white w-full"
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
              className="border border-charcoal rounded-lg p-4 sm:p-5 bg-white shadow-sm w-full overflow-hidden"
            >
              <div className="space-y-4">
                {/* Date and All Day Row */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1 w-full sm:min-w-[200px] min-w-0">
                    <DatePicker
                      control={control as Control<FormValues>}
                      name={
                        `eventDetails.dates.${index}.date` as FieldPath<FormValues>
                      }
                      label="Date"
                      required={true}
                    />
                  </div>

                  <div className="flex items-center gap-4 sm:pt-4 sm:items-start">
                    <FormField
                      control={control}
                      name={`eventDetails.dates.${index}.isAllDay`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 space-y-0">
                          <FormLabel className="cursor-pointer whitespace-nowrap text-sm font-normal">
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
                        variant="outline"
                        size="icon"
                        className="rounded-full hover:bg-red-50 hover:border-red-300 hover:text-red-600"
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
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                value={field.value ?? ""}
                                className="bg-white w-full"
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
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                value={field.value ?? ""}
                                className="bg-white w-full"
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
            className="w-full sm:w-auto border-2 border-dashed hover:border-solid hover:bg-gray-50"
            onClick={() =>
              append({
                date: "",
                isAllDay: true,
                startTime: undefined,
                endTime: undefined,
              })
            }
            type="button"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Another Date
          </Button>
        </div>
      </div>

      {/* Event Poster Section */}
      <div className="space-y-5 border border-charcoal rounded-lg p-5 bg-white shadow-sm">
        <div>
          <h3 className="text-lg font-semibold">Event Poster</h3>
        </div>

        <FormField
          control={control}
          name="eventDetails.poster"
          render={() => (
            <FormItem>
              <FormControl>
                <UploadFile
                  register={register}
                  name="eventDetails.poster"
                  onFileChange={(file) => {
                    setValue("eventDetails.poster", file as Image);
                  }}
                  className="bg-[#E8E7E7]"
                  maxFiles={1}
                  files={eventDetails.poster || null}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Additional Details Section */}
      <div className="space-y-5 border border-charcoal rounded-lg p-5 bg-white shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Details
          </h3>
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
                  className="bg-white min-h-[120px] p-3 rounded-md border border-charcoal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y w-full min-w-0"
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
                  className="bg-white min-h-[120px] p-3 rounded-md border border-charcoal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y w-full min-w-0"
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
                    className="bg-white w-full"
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
                    className="bg-white w-full"
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
