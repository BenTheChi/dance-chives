import { Picture, SubEvent } from "@/types/event";
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
          key={`schedule-${activeSubEventId}`}
          control={control}
          name={`subEvents.${activeSubEventIndex}.schedule`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="bg-white"
                  placeholder="Schedule"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-1/2">
            <DateInput
              key={`startDate-${activeSubEventId}`}
              control={control}
              name={`subEvents.${activeSubEventIndex}.startDate`}
              label="Date"
            />
          </div>
          <div className="w-1/2">
            <FormField
              key={`startTime-${activeSubEventId}`}
              control={control}
              name={`subEvents.${activeSubEventIndex}.startTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="w-1/2">
            <FormField
              key={`endTime-${activeSubEventId}`}
              control={control}
              name={`subEvents.${activeSubEventIndex}.endTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
          control={control}
          name="eventDetails.poster"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poster Upload</FormLabel>
              <FormControl>
                <UploadFile
                  register={register}
                  name={`subEvents.${activeSubEventIndex}.poster`}
                  onFileChange={(file) => {
                    setValue(
                      `subEvents.${activeSubEventIndex}.poster`,
                      file as Picture
                    );
                  }}
                  className="bg-[#E8E7E7]"
                  maxFiles={1}
                  files={activeSubEvent.poster || null}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
