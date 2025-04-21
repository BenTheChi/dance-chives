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
<main className="w-full mx-auto bg-[#E8E7E7] p-6 pl-[200px] relative">
  {/* <img src="/logo_green.png" className="absolute top-0 left-0 ml-4 mt-4" alt="Logo" /> */}
  <h1 className="text-[36px] sm:text-[30px] md:text-[32px] font-inter font-bold mb-4 mt-[120px]">Create Dance Event</h1>
  <Form {...form}>
    <FormField
      control={form.control}
      name="eventTitle"
      render={({ field }) => (
        <FormItem className="mb-4">
          <FormLabel>Event Title</FormLabel>
          <FormControl>
            <Input {...field} className="bg-white" placeholder="Enter Event Title"/>
          </FormControl>
        </FormItem>
      )}
    />
<div className="flex gap-x-4">
  {/* City Field */}
  <FormField
    control={form.control}
    name="city"
    render={({ field }) => (
      <FormItem className="flex-1 mb-4">
        <FormLabel>City</FormLabel>
        <FormControl>
          <Input {...field} className="bg-white w-full" placeholder="Enter City" />
        </FormControl>
      </FormItem>
    )}
  />

  {/* Address Field */}
  <FormField
    control={form.control}
    name="address"
    render={({ field }) => (
      <FormItem className="flex-1 mb-4">
        <FormLabel>Address</FormLabel>
        <FormControl>
          <Input {...field} className="bg-white w-full" placeholder="Enter Address"/>
        </FormControl>
      </FormItem>
    )}
  />
</div>
<div className="flex flex-col md:flex-row gap-4">
  {/* Date Field */}
  <FormField
    control={form.control}
    name="date"
    render={({ field }) => (
      <FormItem className="flex-1 mb-4">
        <FormLabel>Date Range</FormLabel>
        <FormControl>
          <DateRangePicker {...field} className="bg-white w-full" />
        </FormControl>
      </FormItem>
    )}
  />

  {/* Time Field */}
  <FormField
  control={form.control}
  name="time"
  render={({ field }) => (
    <FormItem className="flex-1 mb-4">
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
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem className="mb-4">
      <FormLabel>Description</FormLabel>
      <FormControl>
        <textarea
          {...field}
          className="bg-white w-full h-32 p-2 rounded-md border border-gray-300"
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
    <FormItem className="flex-1 mb-4">
      <FormLabel>Entry Cost</FormLabel>
      <FormControl>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
          <Input
            {...field}
            className="bg-white w-full pl-7" // 👈 padding-left to avoid overlapping $
          />
        </div>
      </FormControl>
    </FormItem>
  )}
/>
        <FormField
          control={form.control}
          name="prize"
          render={({ field }) => (
            <FormItem className="flex-1 mb-4">
              <FormLabel>Prize Pool ($)</FormLabel>
              <FormControl>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">$</span>
          <Input
            {...field}
            className="bg-white w-full pl-7" // 👈 padding-left to avoid overlapping $
          />
        </div>
      </FormControl>
    </FormItem>
  )}
/>
</div>
        <FormField
          control={form.control}
          name="poster"
          render={({ field }) => (
            <FormItem className="flex-1 mb-4">
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
                  className="bg-[#E8E7E7]" />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="mb-6">
        {roles.map((role, index) => (
  <div key={index} className="mb-4">
    {/* Remove role button */}
    <div className="mb-2">
      <Button
        onClick={() => setRoles(roles.filter((_, i) => i !== index))}
        variant="outline"
        size="icon"
        className="rounded-full hover:bg-red-200"
      >
        <MinusIcon />
      </Button>
    </div>

         {/* Side-by-side form fields */}
         <div className="flex gap-x-4">
        <FormField
          control={form.control}
          name={`roles.${index}.role`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Role</FormLabel>
              <FormControl>
                <div className="relative">
                  <Select {...field} onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-white w-full pl-7 pr-10">
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
                  <Trash2 className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 h-4 w-4 cursor-pointer" />
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`roles.${index}.member`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    className="bg-white w-full pl-7 pr-10"
                    placeholder="Name"
                  />
                  <Trash2 className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 h-4 w-4 cursor-pointer" />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  ))}

  <Button
    className="bg-[#DBEAFE] text-[#1181DC] border-2 px-4 py-2 rounded-none hover:bg-[#B4D4F7]" onClick={() => setRoles([...roles, {member: "", role: ""}])}>
    + Add Another Role
  </Button>
  </div>




<Button
  className="mt-[120px] ml-[700px] bg-[#E8E7E7] text-[#000000] border-2 px-4 py-2 pg-rounded hover:bg-[#B4D4F7] min-w-[120px]">
  Cancel
</Button><Button
  className="bg-[#000000] text-[#ffffff] border-2 px-4 py-2 pg-rounded hover:bg-[#B4D4F7] min-w-[140px]">
  Create Event
</Button>

      </Form>
    </main>
  );
}
