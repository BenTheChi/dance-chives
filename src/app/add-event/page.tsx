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
import { MinusIcon } from "lucide-react";
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
    <main>
      <h1>Create Dance Event</h1>
      <Form {...form}>
        <FormField
          control={form.control}
          name="eventTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Range</FormLabel>
              <FormControl>
                <DateRangePicker {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="entryCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entry Cost($)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prize</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="poster"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poster</FormLabel>
              <FormControl>
                <UploadFile
                  register={form.register}
                  name="poster"
                  onFileChange={(file) => {
                    if (file) {
                      field.onChange(file.name);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {roles.map((role, index) => (
          <div key={index}>
            {/* Remove role.  Make this a round minus icon. */}
            <Button
              onClick={() => setRoles(roles.filter((_, i) => i !== index))}
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-red-200"
            >
              <MinusIcon />
            </Button>
            <FormField
              control={form.control}
              name={`roles.${index}.role`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select>
                      <SelectTrigger>
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
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`roles.${index}.member`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button onClick={() => setRoles([...roles, { member: "", role: "" }])}>
          Add Role
        </Button>
      </Form>
    </main>
  );
}
