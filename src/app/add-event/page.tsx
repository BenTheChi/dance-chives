"use client";

import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/ui/daterangepicker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadFile from "@/components/ui/uploadfile";
import { zodResolver } from "@hookform/resolvers/zod";
import { MinusIcon, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// const formSchema = z.object({
//     title: z.string().nonempty(),
//     content: z
//       .string()
//       .min(2000, "Content must be at least 2000 characters")
//       .max(6000, "Content must not exceed 6000 characters"),
//   });

const formSchema = z.object({
  eventTitle: z.string().nonempty(),
  city: z.string().nonempty(),
  address: z.string().nonempty(),
  date: z.string().date(),
  time: z.string().nonempty(),
  description: z.string().nonempty(),
  entryCost: z.string().nonempty(),
  prize: z.string().nonempty(),
  poster: z.string().nonempty(),
  roles: z.array(
    z.object({ member: z.string().nonempty(), role: z.string().nonempty() })
  ),
  //   roles: z.string().nonempty(),
  //   name: z.string().nonempty()
});

const availableRoles = [
  "Organizer",
  "DJ",
  "Photographer",
  "Videographer",
  "Designer",
  "MC",
];

export default function AddEventPage() {
  const [roles, setRoles] = useState<{ member: string; role: string }[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventTitle: "",
      city: "",
      address: "",
      date: "",
      time: "",
      description: "",
      entryCost: "",
      prize: "",
      poster: "",
      roles: [],
    },
  });

  return (
    <main className="flex flex-col gap-4 bg-[#E8E7E7] w-full p-6 md:p-15">
      <h1 className="text-md sm:text-lg md:text-xl font-inter font-bold mt-3">
        Create Dance Event
      </h1>
      <Form {...form}>
        <FormField
          control={form.control}
          name="eventTitle"
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
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="bg-white"
                    placeholder="Enter City"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Address Field */}
          <FormField
            control={form.control}
            name="address"
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
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Date Range</FormLabel>
                <FormControl>
                  <DateRangePicker {...field} className="bg-white w-full" />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Time Field */}
          <div className="w-full">
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        className="bg-white w-full pr-10" // make space for clock icon
                        placeholder="2:00 PM"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <FormField
          control={form.control}
          name="description"
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
        <div className="flex gap-x-4">
          <FormField
            control={form.control}
            name="entryCost"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Entry Cost</FormLabel>
                <FormControl>
                  {/* <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                    $
                  </span> */}
                  <Input {...field} className="bg-white" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prize"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Prize Pool ($)</FormLabel>
                <FormControl>
                  {/* <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                      $
                    </span> */}
                  <Input {...field} className="bg-white" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="poster"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Poster Upload</FormLabel>
              <FormControl>
                <UploadFile
                  register={form.register}
                  name="poster"
                  onFileChange={(file) => {
                    if (file) {
                      field.onChange(file.name);
                    }
                  }}
                  className="bg-[#E8E7E7]"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="mb-6">
          {roles.map((role, index) => (
            <div className="flex items-end gap-5" key={index}>
              {/* Remove role button */}
              <Button
                onClick={() => setRoles(roles.filter((_, i) => i !== index))}
                variant="outline"
                size="icon"
                className="rounded-full hover:bg-red-200"
              >
                <MinusIcon />
              </Button>

              {/* Side-by-side form fields */}
              <div className="flex gap-5">
                <FormField
                  control={form.control}
                  name={`roles.${index}.role`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Select
                          {...field}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="bg-white w-full">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* <Trash2 className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 h-4 w-4 cursor-pointer" /> */}
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`roles.${index}.member`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white"
                          placeholder="Name"
                        />
                        {/* <Trash2 className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 h-4 w-4 cursor-pointer" /> */}
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}

          <Button
            className="border-2 px-4 py-2 rounded-lg hover:bg-[#B4D4F7] mt-5"
            onClick={() => setRoles([...roles, { member: "", role: "" }])}
          >
            + Add Another Role
          </Button>
        </div>

        <div className="flex md:justify-end">
          <Button className="border-2 px-4 py-2 pg-rounded w-[150px]">
            Cancel
          </Button>
          <Button className="border-2 px-4 py-2 pg-rounded w-[150px]">
            Create Event
          </Button>
        </div>
      </Form>
    </main>
  );
}
