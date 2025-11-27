"use client";

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
    <div className="flex flex-col gap-4">
      <FormField
        control={control}
        name="eventDetails.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title</FormLabel>
            <FormControl>
              <Input
                {...field}
                className="bg-white"
                placeholder="Enter Event Title"
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
          // Ensure field.value is always set to a valid enum value
          const value = field.value || "Other";
          return (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select
                onValueChange={(newValue) => {
                  field.onChange(newValue);
                }}
                value={value}
              >
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Battle">Battle</SelectItem>
                  <SelectItem value="Class">Class</SelectItem>
                  <SelectItem value="Competition">Competition</SelectItem>
                  <SelectItem value="Festival">Festival</SelectItem>
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
      <div className="flex flex-col sm:flex-row gap-5">
        {/* City Field */}
        <div className="w-1/2">
          <DebouncedSearchSelect<CitySearchItem, FormValues>
            control={control}
            name="eventDetails.city"
            onSearch={getCitySearchItems}
            placeholder="Search..."
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
          />
        </div>

        {/* Address Field */}
        <FormField
          control={control}
          name="eventDetails.address"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="bg-white"
                  placeholder="Enter Address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* Event Dates Section - Always shown */}
      <div className="mb-6">
        <FormLabel className="text-base mb-4 block">Event Dates</FormLabel>
        {fields.map((field, index) => (
          <div className="flex items-end gap-5 mb-4" key={field.id}>
            {/* Remove date button */}
            {fields.length > 1 && (
              <Button
                onClick={() => remove(index)}
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-red-200"
                type="button"
              >
                <MinusIcon />
              </Button>
            )}

            {/* Date and Time Fields */}
            <div className="flex flex-col gap-5 w-full">
              {/* Date Field and All Day Toggle */}
              <div className="flex flex-col sm:flex-row gap-5 items-end">
                <div className="w-full sm:w-1/3">
                  <DatePicker
                    control={control as Control<FormValues>}
                    name={
                      `eventDetails.dates.${index}.date` as FieldPath<FormValues>
                    }
                    label="Date"
                  />
                </div>
                <FormField
                  control={control}
                  name={`eventDetails.dates.${index}.isAllDay`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 space-y-0">
                      <FormLabel className="cursor-pointer">All Day</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              // When toggling to all-day, clear times
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
              </div>

              {/* Time Fields - Only show when not all-day */}
              {dates?.[index]?.isAllDay === false && (
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Start Time Field */}
                  <div className="w-full sm:w-1/2">
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
                              className="bg-white"
                              placeholder="2:00 PM"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* End Time Field */}
                  <div className="w-full sm:w-1/2">
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
                              className="bg-white"
                              placeholder="4:00 PM"
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
          className="border-2 px-4 py-2 rounded-lg hover:bg-[#B4D4F7] mt-5"
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
                className="bg-white h-32 p-2 rounded-md border border-gray-300"
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
                className="bg-white h-32 p-2 rounded-md border border-gray-300"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex gap-x-4">
        {/* Entry Cost - for Competition events */}
        <FormField
          control={control}
          name="eventDetails.entryCost"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Entry Cost</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="bg-white"
                  placeholder="Optional"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Prize - for Competition events */}
        <FormField
          control={control}
          name="eventDetails.prize"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Prize Pool ($)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="bg-white"
                  placeholder="Optional"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Cost - for Workshop/Session events */}
        <FormField
          control={control}
          name="eventDetails.cost"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Cost</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="bg-white"
                  placeholder="Optional"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="eventDetails.styles"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Styles</FormLabel>
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
                placeholder="Select styles..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="eventDetails.poster"
        render={() => (
          <FormItem className="w-full">
            <FormLabel>Poster Upload</FormLabel>
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
          </FormItem>
        )}
      />
    </div>
  );
}
