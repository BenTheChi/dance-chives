"use client";

import { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { WorkshopDetails, Picture } from "@/types/workshop";
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

interface WorkshopDetailsFormProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  workshopDetails: WorkshopDetails;
  register: UseFormRegister<any>;
  showEventAssociation?: boolean;
  associatedEventId?: string | null;
  onEventChange?: (eventId: string | null) => void;
}

async function getCitySearchItems(keyword: string): Promise<CitySearchItem[]> {
  return fetch(
    `http://geodb-free-service.wirefreethought.com/v1/geo/places?limit=10&sort=population&types=CITY&namePrefix=${keyword}`
  )
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

async function getEventSearchItems(
  keyword: string
): Promise<Array<{ id: string; title: string }>> {
  return fetch(
    `${process.env.NEXT_PUBLIC_ORIGIN}/api/events?keyword=${encodeURIComponent(
      keyword
    )}`
  )
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to fetch events", response.statusText);
        return [];
      }
      return response.json();
    })
    .then((data) => {
      return data.data || [];
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
  showEventAssociation = true,
  associatedEventId,
  onEventChange,
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
      {showEventAssociation && (
        <DebouncedSearchSelect<{ id: string; title: string }>
          control={control}
          name="associatedEventId"
          onSearch={getEventSearchItems}
          placeholder="Search for an event..."
          getDisplayValue={(item) => item.title}
          getItemId={(item) => item.id}
          onChange={(value) => {
            setValue("associatedEventId", value?.id || null);
            onEventChange?.(value?.id || null);
          }}
          value={
            associatedEventId ? { id: associatedEventId, title: "" } : null
          }
          label="Associate with Event (Optional)"
        />
      )}
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
                  setValue("workshopDetails.poster", file as Picture);
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
