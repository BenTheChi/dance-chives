import { SubEvent } from "@/types/event";
import { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./event-form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import DateInput from "../DateInput";
import UploadFile from "../ui/uploadfile";

interface SubEventFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  activeSubEventIndex: number;
  activeSubEvent: SubEvent;
  subEvents: SubEvent[];
  activeSubEventId: string;
  register: UseFormRegister<FormValues>;
}

export function SubEventForm({
  control,
  setValue,
  activeSubEventIndex,
  activeSubEvent,
  subEvents,
  activeSubEventId,
  register,
}: SubEventFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SubEvent Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          key={`title-${activeSubEventId}`}
          control={control}
          name={`subEvents.${activeSubEventIndex}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>SubEvent Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="bg-white"
                  placeholder="New SubEvent Title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          key={`description-${activeSubEventId}`}
          control={control}
          name={`subEvents.${activeSubEventIndex}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="bg-white"
                  placeholder="New SubEvent Description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          key={`startDate-${activeSubEventId}`}
          control={control}
          name={`subEvents.${activeSubEventIndex}.startDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DateInput
                  control={control}
                  name={`subEvents.${activeSubEventIndex}.startDate`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          key={`address-${activeSubEventId}`}
          control={control}
          name={`subEvents.${activeSubEventIndex}.address`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="bg-white"
                  placeholder="New SubEvent Address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          key={`time-${activeSubEventId}`}
          control={control}
          name={`subEvents.${activeSubEventIndex}.time`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="bg-white"
                  placeholder="New SubEvent Time"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="eventDetails.poster"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Poster Upload</FormLabel>
              <FormControl>
                <UploadFile
                  register={register}
                  name={`subEvents.${activeSubEventIndex}.poster`}
                  onFileChange={(file) => {
                    if (file) {
                      setValue(
                        `subEvents.${activeSubEventIndex}.poster`,
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
      </CardContent>
    </Card>
  );
}
