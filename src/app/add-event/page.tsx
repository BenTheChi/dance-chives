"use client";

import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/ui/daterangepicker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MinusIcon, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addEvent } from "@/lib/server_actions/event_actions";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().optional(),
  address: z.string().optional(),
  date: z.object({
    from: z.date(),
    to: z.date(),
  }),
  time: z.string().optional(),
  timezone: z.string().optional(),
  description: z.string().optional(),
  entryCost: z.string().optional(),
  prize: z.string().optional(),
  poster: z.any(),
  roles: z
    .record(
      z.object({
        member: z.string().min(1, "Name is required"),
        role: z.string().min(1, "Role is required"),
      })
    )
    .optional(),
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
  const [roles, setRoles] = useState<{ id: string }[]>([]);
  const [isFetchingTimezone, setIsFetchingTimezone] = useState(false);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      title: "",
      city: "",
      country: "",
      address: "",
      date: { from: new Date(), to: new Date() },
      time: "",
      timezone: "",
      description: "",
      entryCost: "",
      prize: "",
      poster: undefined,
      roles: {},
    },
  });

  const city = form.watch("city");

  // Fetch timezone from API when city changes
  useEffect(() => {
    const fetchTimezone = async () => {
      if (!city || city.length < 3) {
        form.setValue("timezone", "");
        return;
      }

      setIsFetchingTimezone(true);
      setTimezoneError(null);

      try {
        // First get coordinates from city name using OpenCage
        const geocodeResponse = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
            city
          )}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
        );

        if (!geocodeResponse.ok) {
          throw new Error("Failed to geocode city");
        }

        const geocodeData = await geocodeResponse.json();
        if (!geocodeData.results?.length) {
          throw new Error("City not found");
        }

        const { lat, lng } = geocodeData.results[0].geometry;
        const country = geocodeData.results[0].components.country;

        // Then get timezone from coordinates using TimeZoneDB
        const timezoneResponse = await fetch(
          `https://api.timezonedb.com/v2.1/get-time-zone?key=${
            process.env.NEXT_PUBLIC_TIMEZONEDB_API_KEY
          }&format=json&by=position&lat=${lat}&lng=${lng}&fields=zoneName,gmtOffset,abbreviation`
        );

        if (!timezoneResponse.ok) {
          throw new Error("Failed to fetch timezone");
        }

        const timezoneData = await timezoneResponse.json();

        if (timezoneData.status !== "OK") {
          throw new Error("Could not determine timezone");
        }

        // Format the timezone display
        const offsetHours = timezoneData.gmtOffset / 3600;
        const offsetString = `UTC${offsetHours >= 0 ? "+" : ""}${Math.abs(
          offsetHours
        )}`;
        const timezoneString = `${timezoneData.abbreviation} (${offsetString})`;

        form.setValue("timezone", timezoneString);
        form.setValue("country", country); // Optional: Store country if needed
      } catch (error) {
        console.error("Error fetching timezone:", error);
        setTimezoneError(
          error instanceof Error ? error.message : "Failed to detect timezone"
        );
        form.setValue("timezone", "");
      } finally {
        setIsFetchingTimezone(false);
      }
    };

    // Add debounce to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      fetchTimezone();
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [city, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const processedRoles = roles.map((role) => {
        const memberValue = form.getValues(`roles.${role.id}.member`);
        const roleValue = form.getValues(`roles.${role.id}.role`);
        return { member: memberValue, role: roleValue };
      });

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('city', JSON.stringify({
        name: data.city,
        country: data.country || "Unknown",
        timezone: data.timezone || "Unknown",
      }));
      formData.append('date', JSON.stringify(data.date));
      if (data.address) formData.append('address', data.address);
      if (data.time) formData.append('time', data.time);
      if (data.description) formData.append('description', data.description);
      if (data.entryCost) formData.append('entryCost', data.entryCost);
      if (data.prize) formData.append('prize', data.prize);
      if (data.poster) formData.append('poster', data.poster);
      formData.append('roles', JSON.stringify(processedRoles));

      await addEvent(formData);
      // Optionally add success notification/redirect here
    } catch (error) {
      console.error("Error submitting form:", error);
      // Optionally add error notification here
    }
  };

  const addRole = () => {
    const newRoleId = Math.random().toString(36).substring(2, 9);
    const newRole = { id: newRoleId };

    setRoles([...roles, newRole]);
    form.setValue(`roles.${newRoleId}.member`, "");
    form.setValue(`roles.${newRoleId}.role`, "");
  };

  const removeRole = (idToRemove: string) => {
    setRoles(roles.filter((r) => r.id !== idToRemove));
    const currentRoles = form.getValues().roles || {};
    const { [idToRemove]: _, ...remainingRoles } = currentRoles;
    form.setValue("roles", remainingRoles);
  };

  return (
    <main className="flex flex-col gap-4 bg-[#E8E7E7] w-full p-6 md:p-15">
      <h1 className="text-md sm:text-lg md:text-xl font-inter font-bold mt-3">
        Create Dance Event
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City and Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white"
                      placeholder="Enter City"
                    />
                  </FormControl>
                  <FormMessage />
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

          {/* Date, Time and Timezone Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Range</FormLabel>
                  <FormControl>
                    <DateRangePicker {...field} className="bg-white w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          className="bg-white w-full pr-10"
                          placeholder="HH:MM"
                        />
                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          className="bg-white w-full"
                          placeholder={
                            isFetchingTimezone ? "Detecting..." : "Auto-detected"
                          }
                          disabled
                        />
                        {isFetchingTimezone && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {timezoneError && (
                      <p className="text-sm text-red-500">{timezoneError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    className="bg-white h-32 p-2 rounded-md border border-gray-300 w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Entry Cost and Prize Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entryCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Cost</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white"
                      placeholder="e.g., $10 or Free"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prize Pool ($)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white"
                      placeholder="e.g., 1000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Poster Upload */}
          <FormField
            control={form.control}
            name="poster"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Poster</FormLabel>
                <FormControl>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      field.onChange(e.target.files ? e.target.files[0] : null)
                    }
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Roles Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Team Members</h3>
            {roles.map((role) => (
              <div className="flex items-start gap-4" key={role.id}>
                <Button
                  onClick={() => removeRole(role.id)}
                  variant="outline"
                  size="icon"
                  className="rounded-full hover:bg-red-200 mt-1"
                  type="button"
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                  <FormField
                    control={form.control}
                    name={`roles.${role.id}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`roles.${role.id}.member`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-white"
                            placeholder="Team member name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addRole}
              className="mt-2"
            >
              + Add Team Member
            </Button>
          </div>

          {/* Form Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-32"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-32 bg-blue-600 hover:bg-blue-700"
            >
              Create Event
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
