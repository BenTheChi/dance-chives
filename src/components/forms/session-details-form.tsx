"use client";

import { useEffect } from "react";
import {
  Control,
  UseFormRegister,
  UseFormSetValue,
  useFieldArray,
} from "react-hook-form";
import { SessionDetails, SessionDate } from "@/types/session";
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
import DateInput from "../DateInput";
import { StyleMultiSelect } from "../ui/style-multi-select";
import { Button } from "../ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";

interface SessionDetailsFormProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  sessionDetails: SessionDetails;
  register: UseFormRegister<any>;
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

export function SessionDetailsForm({
  control,
  setValue,
  sessionDetails,
  register,
}: SessionDetailsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "sessionDetails.dates",
  });

  // Initialize with one date entry if empty
  useEffect(() => {
    if (fields.length === 0) {
      append({
        date: "",
        startTime: "",
        endTime: "",
      });
    }
  }, [fields.length, append]);

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={control}
        name="sessionDetails.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Session Title</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  field.onChange(e);
                  if (setValue) {
                    setValue("sessionDetails.title", newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }
                }}
                className="bg-white"
                placeholder="Enter Session Title"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex flex-col sm:flex-row gap-5">
        {/* City Field */}
        <div className="w-1/2">
          <DebouncedSearchSelect<CitySearchItem>
            control={control}
            name="sessionDetails.city"
            onSearch={getCitySearchItems}
            placeholder="Search..."
            getDisplayValue={(item: CitySearchItem) => {
              if (!item.name || !item.region) return "";
              return item.name + ", " + item.region;
            }}
            getItemId={(item) => item.id}
            onChange={(value) => {
              setValue("sessionDetails.city", value as City);
            }}
            value={sessionDetails.city}
            label="City"
          />
        </div>

        {/* Address Field */}
        <FormField
          control={control}
          name="sessionDetails.address"
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

      {/* Multiple Dates Section */}
      <div className="mb-6">
        <FormLabel className="text-base mb-4 block">Session Dates</FormLabel>
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
            <div className="flex flex-col sm:flex-row gap-5 w-full">
              {/* Date Field */}
              <div className="w-full sm:w-1/3">
                <DateInput
                  control={control as any}
                  name={`sessionDetails.dates.${index}.date` as any}
                  label="Date"
                />
              </div>

              {/* Start Time Field */}
              <div className="w-full sm:w-1/3">
                <FormField
                  control={control}
                  name={`sessionDetails.dates.${index}.startTime`}
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
              <div className="w-full sm:w-1/3">
                <FormField
                  control={control}
                  name={`sessionDetails.dates.${index}.endTime`}
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
          </div>
        ))}

        <Button
          className="border-2 px-4 py-2 rounded-lg hover:bg-[#B4D4F7] mt-5"
          onClick={() =>
            append({
              date: "",
              startTime: "",
              endTime: "",
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
        name="sessionDetails.description"
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
        name="sessionDetails.schedule"
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
      <FormField
        control={control}
        name="sessionDetails.cost"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Cost</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                className="bg-white"
                placeholder="e.g., $50"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="sessionDetails.styles"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Styles</FormLabel>
            <FormControl>
              <StyleMultiSelect
                value={field.value ?? []}
                onChange={(styles) => {
                  field.onChange(styles);
                  setValue("sessionDetails.styles", styles, {
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
        name="sessionDetails.poster"
        render={() => (
          <FormItem className="w-full">
            <FormLabel>Poster Upload</FormLabel>
            <FormControl>
              <UploadFile
                register={register}
                name="sessionDetails.poster"
                onFileChange={(file) => {
                  setValue("sessionDetails.poster", file as Image);
                }}
                className="bg-[#E8E7E7]"
                maxFiles={1}
                files={sessionDetails.poster || null}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
