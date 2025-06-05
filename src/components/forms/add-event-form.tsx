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
import { MinusIcon, Clock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addEvent } from "@/lib/server_actions/event_actions";
import { CitySearchItem } from "@/types/city";
import { DebouncedSearchSelect } from "../DebouncedSearchSelect";
import { UserSearchItem } from "@/types/user";

// Modified schema to make roles validation work better
const formSchema = z.object({
  title: z.string().nonempty(),
  city: z
    .object({
      id: z.number(),
      name: z.string(),
      region: z.string(),
      countryCode: z.string(),
      population: z.number(),
    })
    .nullable(),
  address: z.string().optional(),
  date: z.object({
    from: z.date(),
    to: z.date(),
  }),
  time: z.string().optional(),
  description: z.string().optional(),
  entryCost: z.string().optional(),
  prize: z.string().optional(),
  poster: z.any(),
  // Make roles validation optional or allow empty strings
  roles: z
    .record(
      z.object({
        user: z
          .object({
            id: z.string(),
            username: z.string(),
            displayName: z.string(),
          })
          .nullable(),
        role: z.string().nonempty(),
      })
    )
    .optional(),
});

export default function AddEventForm() {
  const [roles, setRoles] = useState<{ id: string }[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      title: "",
      city: null,
      address: "",
      date: {},
      time: "",
      description: "",
      entryCost: "",
      prize: "",
      poster: undefined,
      roles: {},
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const processedRoles = roles.map((role) => {
      const userValue = form.getValues(`roles.${role.id}.user`);
      const roleValue = form.getValues(`roles.${role.id}.role`);
      return { user: userValue, role: roleValue };
    });

    const finalData = {
      ...data,
      roles: processedRoles,
    };

    console.log(finalData);

    // addEvent(finalData);
  };

  async function getCitySearchItems(
    keyword: string
  ): Promise<CitySearchItem[]> {
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

  async function getUserSearchItems(
    keyword: string
  ): Promise<UserSearchItem[]> {
    return fetch(
      `${process.env.NEXT_PUBLIC_ORIGIN}/api/users?keyword=${keyword}`
    )
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to fetch users", response.statusText);
          return [];
        }
        return response.json();
      })
      .then((data) => {
        return data.data;
      })
      .catch((error) => {
        console.error(error);
        return [];
      });
  }

  // Add a new role entry
  const addRole = () => {
    const newRoleId = Math.random().toString(36).substring(2, 9);
    const newRole = { id: newRoleId };

    // Add to our local state array
    setRoles([...roles, newRole]);

    // Initialize the form field values
    form.setValue(`roles.${newRoleId}.user`, null);
    form.setValue(`roles.${newRoleId}.role`, "");
  };

  // Remove a role entry
  const removeRole = (idToRemove: string) => {
    setRoles(roles.filter((r) => r.id !== idToRemove));

    // Clean up the form field values
    const currentRoles = form.getValues().roles || {};
    const { [idToRemove]: _, ...remainingRoles } = currentRoles;
    form.setValue("roles", remainingRoles);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="title"
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
            <DebouncedSearchSelect<CitySearchItem>
              onSearch={getCitySearchItems}
              placeholder="Search..."
              getDisplayValue={(item: CitySearchItem) => {
                return item.name + ", " + item.region;
              }}
              getItemId={(item) => item.id}
              onChange={(value) => {
                form.setValue("city", value);
              }}
              value={form.getValues("city")}
              name="city"
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
                        form.setValue("poster", file || undefined);
                      }
                    }}
                    className="bg-[#E8E7E7]"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="mb-6">
            {roles.map((role) => (
              <div className="flex items-end gap-5 mb-4" key={role.id}>
                {/* Remove role button */}
                <Button
                  onClick={() => removeRole(role.id)}
                  variant="outline"
                  size="icon"
                  className="rounded-full hover:bg-red-200"
                  type="button"
                >
                  <MinusIcon />
                </Button>

                {/* Side-by-side form fields */}
                <div className="flex gap-5 w-full">
                  <FormField
                    control={form.control}
                    name={`roles.${role.id}.role`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
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
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DebouncedSearchSelect<UserSearchItem>
                    onSearch={getUserSearchItems}
                    placeholder="Search..."
                    getDisplayValue={(item: UserSearchItem) => {
                      return `${item.displayName} (${item.username})`;
                    }}
                    getItemId={(item) => item.id}
                    onChange={(value) => {
                      form.setValue(`roles.${role.id}.user`, value);
                    }}
                    value={form.getValues(`roles.${role.id}.user`)}
                    name={"User"}
                  />
                </div>
              </div>
            ))}

            <Button
              className="border-2 px-4 py-2 rounded-lg hover:bg-[#B4D4F7] mt-5"
              onClick={addRole}
              type="button"
            >
              + Add Another Role
            </Button>
          </div>

          <div className="flex md:justify-end">
            <Button
              className="border-2 px-4 py-2 pg-rounded w-[150px]"
              type="button"
            >
              Cancel
            </Button>
            <Button
              className="border-2 px-4 py-2 pg-rounded w-[150px]"
              type="submit"
            >
              Create Event
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
