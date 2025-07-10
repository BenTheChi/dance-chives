"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { SectionForm } from "@/components/forms/section-form";
import { Section, EventDetails, Role, SubEvent, Picture } from "@/types/event";
import { EventDetailsForm } from "./event-details-form";
import RolesForm from "./roles-form";
import { SubEventForm } from "./subevent-form";
import UploadFile from "../ui/uploadfile";
import { addEvent, editEvent } from "@/lib/server_actions/event_actions";
import { usePathname } from "next/navigation";

const userSearchItemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
});

const videoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Video title is required"), // switch to min for all non-optional
  src: z
    .string()
    .min(1, "Video source is required")
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}(&.*)?$/,
      "Video source must be a valid YouTube URL"
    ),
  taggedUsers: z.array(userSearchItemSchema).optional(),
});

const bracketSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Bracket title is required"), // switch to min for all non-optional
  videos: z.array(videoSchema),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Section title is required"), // switch to min for all non-optional
  description: z.string().optional(),
  hasBrackets: z.boolean(),
  videos: z.array(videoSchema),
  brackets: z.array(bracketSchema),
});

const pictureSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.string(),
  file: z.instanceof(File).nullable(),
});

const eventDetailsSchema = z.object({
  creatorId: z.string(),
  title: z.string().min(1, "Event title is required"), // switch to min for all non-optional
  city: z.object({
    id: z.number(),
    name: z.string().min(1, "City name is required"),
    countryCode: z.string().min(1, "Country code is required"),
    region: z.string().min(1, "Region is required"),
    population: z.number(),
  }),
  startDate: z.string().min(1, "Start date is required"), // switch to min for all non-optional
  description: z.string().optional(),
  schedule: z.string().optional(),
  address: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  prize: z.string().optional(),
  entryCost: z.string().optional(),
  poster: pictureSchema.nullable().optional(),
});

const roleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Role title is required"), // switch to min for all non-optional
  user: userSearchItemSchema.nullable(),
});

const subEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Sub-event title is required"), // switch to min for all non-optional
  description: z.string().optional(),
  schedule: z.string().optional(),
  startDate: z.string().min(1, "Sub-event start date is required"), // switch to min for all non-optional
  address: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  poster: pictureSchema.nullable().optional(),
});

const formSchema = z.object({
  eventDetails: eventDetailsSchema,
  sections: z.array(sectionSchema),
  roles: z.array(roleSchema).optional(),
  subEvents: z.array(subEventSchema),
  gallery: z.array(pictureSchema),
});

export type FormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  initialData?: FormValues;
}

export default function EventForm({ initialData }: EventFormProps = {}) {
  const pathname = usePathname().split("/");
  const isEditing = pathname[pathname.length - 1] === "edit";

  const [activeMainTab, setActiveMainTab] = useState("Sections");
  const [activeSectionId, setActiveSectionId] = useState("2");
  const [activeSubEventId, setActiveSubEventId] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values or initial data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: initialData || {},
  });

  const { control, handleSubmit, setValue, register, watch } = form;

  const sections = watch("sections") ?? [];
  const eventDetails = watch("eventDetails");
  const subEvents = watch("subEvents") ?? [];
  const roles = watch("roles") ?? [];
  const gallery = watch("gallery") ?? [];
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const activeSubEvent = subEvents.find((s) => s.id === activeSubEventId);

  const mainTabs = [
    "Event Details",
    "Roles",
    "Subevents",
    "Sections",
    "Photo Gallery",
  ];

  const addSection = () => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      title: `New Section ${sections.length + 1}`,
      description: "",
      hasBrackets: false,
      videos: [],
      brackets: [],
    };
    setValue("sections", [...sections, newSection]);
    setActiveSectionId(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    const updatedSections = sections.filter(
      (section) => section.id !== sectionId
    );
    setValue("sections", updatedSections);

    // If we removed the active section, switch to the first available section
    if (activeSectionId === sectionId && updatedSections.length > 0) {
      setActiveSectionId(updatedSections[0].id);
    }
  };

  const addSubEvent = () => {
    const newSubEvent: SubEvent = {
      id: crypto.randomUUID(),
      title: `New SubEvent ${subEvents.length + 1}`,
      startDate: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      address: "",
      startTime: "",
      endTime: "",
      description: "",
      schedule: "",
      poster: null,
    };
    setValue("subEvents", [...subEvents, newSubEvent]);
    setActiveSubEventId(newSubEvent.id);
  };

  const removeSubEvent = (subEventId: string) => {
    const updatedSubEvents = subEvents.filter((s) => s.id !== subEventId);
    setValue("subEvents", updatedSubEvents);

    // If we removed the active subevent, switch to the first available subevent
    if (activeSubEventId === subEventId && updatedSubEvents.length > 0) {
      setActiveSubEventId(updatedSubEvents[0].id);
    }
  };

  // extract field names from validation errors
  const getFieldNamesFromErrors = (errors: FieldErrors): string[] => {
    const fieldNames: string[] = [];

    const extractFieldNames = (obj: FieldErrors, prefix = "") => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === "object") {
          if (obj[key].message) {
            // This is a field with an error
            const fieldName = prefix ? `${prefix}.${key}` : key;
            fieldNames.push(fieldName);
          } else if (!obj[key].type) {
            // This is a nested object (not a FieldError), recurse
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            extractFieldNames(obj[key] as FieldErrors, newPrefix);
          }
        }
      }
    };

    extractFieldNames(errors);
    return fieldNames;
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      let response;
      if (isEditing) {
        response = await editEvent(pathname[pathname.length - 2], data);
      } else {
        response = await addEvent(data);
      }

      if (response.error) {
        if (isEditing) {
          toast.error("Failed to update event", {
            description: response.error,
          });
        } else {
          toast.error("Failed to create event", {
            description: response.error,
          });
        }
      } else {
        if (isEditing) {
          toast.success("Event updated successfully!", {
            description: "Your event has been updated and is now live.",
          });
        } else {
          toast.success("Event created successfully!", {
            description: "Your event has been created and is now live.",
          });
        }
        // TODO: Redirect to the event page
        // router.push(`/events/${response.event.id}`);
      }
      // if non res error, log it
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: FieldErrors) => {
    console.error("Form validation errors:", errors);

    const invalidFields = getFieldNamesFromErrors(errors);

    const tabMap: { [key: string]: string } = {
      eventDetails: "Event Details",
      sections: "Sections",
      subEvents: "SubEvents",
      roles: "Roles",
      gallery: "Photo Gallery",
    };

    // Map required fields to user-friendly names, including dynamic array fields
    const fieldDisplayNames: { [key: string]: string } = {
      "eventDetails.title": "Event Title",
      "eventDetails.startDate": "Event Date",
      "eventDetails.city.name": "City Name",
      "eventDetails.city.countryCode": "Country Code",
      "eventDetails.city.region": "Region",
      "sections.title": "Section Title",
      "sections.videos.title": "Video Title",
      "sections.videos.src": "Video Source",
      "sections.brackets.title": "Bracket Title",
      "sections.brackets.videos.title": "Bracket Video Title",
      "sections.brackets.videos.src": "Bracket Video Source",
      "subEvents.title": "Title",
      "subEvents.startDate": "Date",
      "roles.title": "Role",
      "roles.user": "User",
    };

    const tabErrors: { [tab: string]: Set<string> } = {};

    for (const field of invalidFields) {
      // Find which tab this field belongs to
      const tabKey = Object.keys(tabMap).find((tab) => field.startsWith(tab));
      if (tabKey) {
        if (!tabErrors[tabKey]) tabErrors[tabKey] = new Set();
        // Try to get a display name for the field
        // Try to match the field exactly, or by prefix (for arrays)
        let displayName = fieldDisplayNames[field];
        if (!displayName) {
          // regex to remove indices (e.g., sections.0.videos.0.title -> sections.videos.title)
          const genericField = field.replace(/\.(\d+)/g, "");
          // Try for bracketed videos
          if (
            genericField.includes("brackets") &&
            genericField.includes("videos")
          ) {
            if (genericField.endsWith(".title"))
              displayName = fieldDisplayNames["sections.brackets.videos.title"];
            else if (genericField.endsWith(".src"))
              displayName = fieldDisplayNames["sections.brackets.videos.src"];
            else if (genericField.endsWith(".title"))
              displayName = fieldDisplayNames["sections.brackets.title"];
          } else if (genericField.includes("videos")) {
            if (genericField.endsWith(".title"))
              displayName = fieldDisplayNames["sections.videos.title"];
            else if (genericField.endsWith(".src"))
              displayName = fieldDisplayNames["sections.videos.src"];
          } else if (genericField.includes("brackets")) {
            if (genericField.endsWith(".title"))
              displayName = fieldDisplayNames["sections.brackets.title"];
          } else if (genericField.includes("title")) {
            displayName = fieldDisplayNames[`${tabKey}.title`];
          } else if (genericField.includes("startDate")) {
            displayName = fieldDisplayNames[`${tabKey}.startDate`];
          } else if (genericField.includes("user")) {
            displayName = fieldDisplayNames[`${tabKey}.user`];
          }
          // Fallback: use last part of field path
          if (!displayName)
            displayName = genericField.split(".").pop() || "Unknown Field";
        }
        tabErrors[tabKey].add(displayName);
      }
    }

    // toast message as component - this allows for line breaks
    const toastContent = (
      <div>
        <div>Please fix the following issues:</div>
        {Object.keys(tabErrors).map((tabKey) => {
          const tabName = tabMap[tabKey];
          const fields = Array.from(tabErrors[tabKey])
            .filter(Boolean)
            .join(", ");
          return (
            <div key={tabKey}>
              <strong>{tabName}:</strong> {fields}
            </div>
          );
        })}
      </div>
    );

    toast.error(toastContent, {
      duration: 7000,
    });
  };

  const activeSectionIndex = sections.findIndex(
    (s) => s.id === activeSectionId
  );

  const activeSubEventIndex = subEvents.findIndex(
    (s) => s.id === activeSubEventId
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        {isEditing ? "Edit Event" : "New Event"}
      </h1>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit, onError)}>
          {/* Main Navigation - Text Style Tabs */}
          <div className="flex justify-center gap-8 mb-8">
            {mainTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMainTab(tab)}
                className={`text-lg font-medium pb-2 border-b-2 transition-colors ${
                  activeMainTab === tab
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeMainTab === "Event Details" && (
            <EventDetailsForm
              control={control}
              setValue={setValue}
              eventDetails={eventDetails as EventDetails}
              register={register}
            />
          )}

          {activeMainTab === "Roles" && (
            <RolesForm
              control={control}
              setValue={setValue}
              roles={roles as Role[]}
            />
          )}

          {activeMainTab === "Subevents" && (
            <div className="space-y-6">
              <div className="flex gap-2 items-center flex-wrap">
                {subEvents.map((subEvent) => (
                  <div key={subEvent.id} className="relative group">
                    <Button
                      type="button"
                      variant={
                        activeSubEventId === subEvent.id ? "default" : "outline"
                      }
                      onClick={() => setActiveSubEventId(subEvent.id)}
                      className="pr-8"
                    >
                      {subEvent.title}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubEvent(subEvent.id)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addSubEvent} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add SubEvent
                </Button>
              </div>

              {activeSubEvent && (
                <SubEventForm
                  control={control}
                  setValue={setValue}
                  activeSubEventIndex={activeSubEventIndex}
                  activeSubEvent={activeSubEvent}
                  activeSubEventId={activeSubEventId}
                  register={register}
                />
              )}
            </div>
          )}

          {activeMainTab === "Sections" && (
            <div className="space-y-6">
              {/* Section Navigation with Remove Icons */}
              <div className="flex gap-2 items-center flex-wrap">
                {sections.map((section) => (
                  <div key={section.id} className="relative group">
                    <Button
                      type="button"
                      variant={
                        activeSectionId === section.id ? "default" : "outline"
                      }
                      onClick={() => setActiveSectionId(section.id)}
                      className="pr-8"
                    >
                      {section.title}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addSection} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {/* Section Form Component */}
              {activeSection && (
                <SectionForm
                  control={control}
                  setValue={setValue}
                  activeSectionIndex={activeSectionIndex}
                  activeSection={activeSection}
                  sections={sections}
                  activeSectionId={activeSectionId}
                />
              )}
            </div>
          )}

          {activeMainTab === "Photo Gallery" && (
            <FormField
              control={control}
              name="gallery"
              render={() => (
                <FormItem className="w-full">
                  <FormLabel>Photo Gallery</FormLabel>
                  <FormControl>
                    <UploadFile
                      register={register}
                      name="gallery"
                      onFileChange={(files) => {
                        if (files) {
                          setValue("gallery", files as Picture[]);
                        } else {
                          setValue("gallery", []);
                        }
                      }}
                      className="bg-[#E8E7E7]"
                      maxFiles={3}
                      files={gallery || null}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          {/* Bottom Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button type="button" variant="destructive">
              Cancel
            </Button>
            <Button type="button" variant="outline">
              Previous
            </Button>
            <Button type="button" variant="outline">
              Next
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting Event..." : "Finish"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
