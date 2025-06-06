"use client";

import { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./event-form";
import { EventDetails } from "@/types/event";
import { City, CitySearchItem } from "@/types/city";
import { FormControl, FormItem, FormLabel, FormField } from "../ui/form";
import { Input } from "../ui/input";
import { DebouncedSearchSelect } from "../DebouncedSearchSelect";
import UploadFile from "../ui/uploadfile";
import { Clock } from "lucide-react";
import DateInput from "../DateInput";

interface EventDetailsFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  eventDetails: EventDetails;
  register: UseFormRegister<FormValues>;
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
    .then((data) =>
      data.data
        .map((city: any) => ({
          id: city.id,
          name: city.name,
          region: city.region,
          countryCode: city.countryCode,
          population: city.population,
        }))
        .reverse()
    )
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
          </FormItem>
        )}
      />
      <div className="flex flex-col sm:flex-row gap-5">
        {/* City Field */}

        <div className="w-1/2">
          <DebouncedSearchSelect<CitySearchItem>
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
              console.log(value);
              setValue("eventDetails.city", value as City | null);
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
                  className="bg-white"
                  placeholder="Enter Address"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Date Field */}
        <DateInput
          control={control}
          name="eventDetails.startDate"
          label="Date"
        />

        {/* Time Field */}
        <div className="w-1/2">
          <FormField
            control={control}
            name="eventDetails.startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    className="bg-white" // make space for clock icon
                    placeholder="2:00 PM"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="w-1/2">
          <FormField
            control={control}
            name="eventDetails.endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    className="bg-white" // make space for clock icon
                    placeholder="2:00 PM"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
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
                className="bg-white h-32 p-2 rounded-md border border-gray-300"
              />
            </FormControl>
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
                className="bg-white h-32 p-2 rounded-md border border-gray-300"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="flex gap-x-4">
        <FormField
          control={control}
          name="eventDetails.entryCost"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Entry Cost</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="eventDetails.prize"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Prize Pool ($)</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="eventDetails.poster"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Poster Upload</FormLabel>
            <FormControl>
              <UploadFile
                register={register}
                name="eventDetails.poster"
                onFileChange={(file) => {
                  if (file) {
                    setValue(
                      "eventDetails.poster",
                      file as unknown as {
                        id: string;
                        title: string;
                        src: string;
                        type: string;
                      }
                    );
                  }
                }}
                className="bg-[#E8E7E7]"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
