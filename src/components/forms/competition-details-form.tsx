"use client";

import { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./competition-form";
import { CompetitionDetails } from "@/types/event";
import { Image } from "@/types/image";
import { City, CitySearchItem } from "@/types/city";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
} from "../ui/form"; // form components
import { Input } from "../ui/input";
import { DebouncedSearchSelect } from "../DebouncedSearchSelect";
import UploadFile from "../ui/uploadfile";
import DateInput from "../DateInput";

interface CompetitionDetailsFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  eventDetails: CompetitionDetails;
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

export function CompetitionDetailsForm({
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
            {/* // add form message to display errors / validation */}
            <FormMessage />
          </FormItem>
        )}
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
                {/* add form message to display errors / validation */}
                <FormMessage />
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
                {/* add form message to display errors / validation */}
                <FormMessage />
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
                value={field.value ?? ""}
                className="bg-white h-32 p-2 rounded-md border border-gray-300"
              />
            </FormControl>
            {/* add form message to display errors / validation */}
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
            {/* add form message to display errors / validation */}
            <FormMessage />
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
              {/* add form message to display errors / validation */}
              <FormMessage />
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
              {/* add form message to display errors / validation */}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
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
