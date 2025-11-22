"use client";

import {
  Control,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { WorkshopDetails } from "@/types/workshop";
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

interface WorkshopDetailsFormProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  workshopDetails: WorkshopDetails;
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

export function WorkshopDetailsForm({
  control,
  setValue,
  workshopDetails,
  register,
}: WorkshopDetailsFormProps) {

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={control}
        name="workshopDetails.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Workshop Title</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  field.onChange(e);
                  // Also call setValue to ensure form state updates trigger watch
                  // This is especially important for embedded contexts
                  if (setValue) {
                    setValue("workshopDetails.title", newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }
                }}
                className="bg-white"
                placeholder="Enter Workshop Title"
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
            name="workshopDetails.city"
            onSearch={getCitySearchItems}
            placeholder="Search..."
            getDisplayValue={(item: CitySearchItem) => {
              if (!item.name || !item.region) return "";
              return item.name + ", " + item.region;
            }}
            getItemId={(item) => item.id}
            onChange={(value) => {
              setValue("workshopDetails.city", value as City);
            }}
            value={workshopDetails.city}
            label="City"
          />
        </div>

        {/* Address Field */}
        <FormField
          control={control}
          name="workshopDetails.address"
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
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Date Field */}
        <DateInput
          control={control as any}
          name={"workshopDetails.startDate" as any}
          label="Date"
        />

        {/* Time Field */}
        <div className="w-1/2">
          <FormField
            control={control}
            name="workshopDetails.startTime"
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
        <div className="w-1/2">
          <FormField
            control={control}
            name="workshopDetails.endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
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
      </div>
      <FormField
        control={control}
        name="workshopDetails.description"
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
        name="workshopDetails.schedule"
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
        name="workshopDetails.cost"
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
        name="workshopDetails.styles"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Styles</FormLabel>
            <FormControl>
              <StyleMultiSelect
                value={field.value ?? []}
                onChange={(styles) => {
                  field.onChange(styles);
                  setValue("workshopDetails.styles", styles, {
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
        name="workshopDetails.poster"
        render={() => (
          <FormItem className="w-full">
            <FormLabel>Poster Upload</FormLabel>
            <FormControl>
              <UploadFile
                register={register}
                name="workshopDetails.poster"
                onFileChange={(file) => {
                  setValue("workshopDetails.poster", file as Image);
                }}
                className="bg-[#E8E7E7]"
                maxFiles={1}
                files={workshopDetails.poster || null}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
