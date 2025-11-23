"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { FieldErrors, useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { SectionForm } from "@/components/forms/section-form";
import { Section, EventDetails, Role } from "@/types/event";
import { Image } from "@/types/image";
import { Video } from "@/types/video";
import { EventDetailsForm } from "./event-details-form";
import RolesForm from "./roles-form";
import { AVAILABLE_ROLES } from "@/lib/utils/roles";
import UploadFile from "../ui/uploadfile";
import { addEvent, editEvent } from "@/lib/server_actions/event_actions";
import { usePathname, useRouter } from "next/navigation";
import { VideoForm } from "./video-form";

const userSearchItemSchema = z.object({
  id: z.string().optional(), // Optional - only present when coming from server data
  displayName: z.string(),
  username: z.string(),
});

const videoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Video title is required"), // switch to min for all non-optional
  src: z
    .string()
    .min(1, "Video source is required")
    .refine(
      (url) => {
        // Use the same patterns as extractYouTubeVideoId utility
        const patterns = [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?&]+)/,
        ];
        return patterns.some((pattern) => pattern.test(url));
      },
      {
        message: "Video source must be a valid YouTube URL",
      }
    ),
  type: z
    .enum(["battle", "freestyle", "choreography", "class"])
    .default("battle"),
  taggedWinners: z.array(userSearchItemSchema).optional(),
  taggedDancers: z.array(userSearchItemSchema).optional(),
  taggedChoreographers: z.array(userSearchItemSchema).optional(),
  taggedTeachers: z.array(userSearchItemSchema).optional(),
  styles: z.array(z.string()).optional(),
});

const bracketSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Bracket title is required"), // switch to min for all non-optional
  videos: z.array(videoSchema),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Section title is required"), // switch to min for all non-optional
  description: z.preprocess((val) => val ?? "", z.string()),
  sectionType: z
    .enum([
      "Battle",
      "Tournament",
      "Competition",
      "Performance",
      "Showcase",
      "Class",
      "Session",
      "Mixed",
    ])
    .optional(),
  hasBrackets: z.boolean(),
  videos: z.array(videoSchema),
  brackets: z.array(bracketSchema),
  styles: z.array(z.string()).optional(),
  applyStylesToVideos: z.boolean().optional(),
  winners: z.array(userSearchItemSchema).optional(),
});

const imageSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  file: z.instanceof(File).nullable(),
});

const eventDetailsSchema = z.object({
  creatorId: z.string().nullable().optional(), // Set server-side from session, can be null
  title: z.string().min(1, "Event title is required"), // switch to min for all non-optional
  city: z.object({
    id: z.number(),
    name: z.string().min(1, "City name is required"),
    countryCode: z.string().min(1, "Country code is required"),
    region: z.string().min(1, "Region is required"),
    population: z.number(),
  }),
  // Dates array - required, must have at least one entry
  // The year of this date should be between 1900 and 2300
  dates: z
    .array(
      z
        .object({
          date: z
            .string()
            .min(1, "Date is required")
            .regex(
              /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20|21|22|23)[0-9]{2}$/,
              "Date must be in MM/DD/YYYY format"
            ),
          startTime: z.string().min(1, "Start time is required"),
          endTime: z.string().min(1, "End time is required"),
        })
        .refine(
          (data) => {
            if (!data.startTime || !data.endTime) return true;
            const [startHours, startMinutes] = data.startTime
              .split(":")
              .map(Number);
            const [endHours, endMinutes] = data.endTime.split(":").map(Number);
            const startTotal = startHours * 60 + startMinutes;
            const endTotal = endHours * 60 + endMinutes;
            return endTotal > startTotal;
          },
          {
            message: "End time must be after start time",
            path: ["endTime"],
          }
        )
    )
    .min(1, "At least one event date is required"),
  description: z.preprocess((val) => val ?? "", z.string()),
  schedule: z.preprocess((val) => val ?? "", z.string()),
  address: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  prize: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  entryCost: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  cost: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ), // For Workshop/Session events
  poster: imageSchema.nullable().optional(),
  eventType: z
    .enum([
      "Battle",
      "Competition",
      "Class",
      "Workshop",
      "Session",
      "Party",
      "Festival",
      "Performance",
    ])
    .optional(),
  styles: z.array(z.string()).optional(),
});

const roleSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, "Role title is required")
    .refine(
      (val) => AVAILABLE_ROLES.includes(val as any),
      `Role must be one of: ${AVAILABLE_ROLES.join(", ")}`
    ),
  user: userSearchItemSchema.nullable(),
});

const formSchema = z.object({
  eventDetails: eventDetailsSchema,
  sections: z.array(sectionSchema).refine(
    (sections) => {
      const titles = sections.map((s) => s.title.toLowerCase().trim());
      const uniqueTitles = new Set(titles);
      return uniqueTitles.size === titles.length;
    },
    {
      message: "Section titles must be unique within an event",
    }
  ),
  roles: z.array(roleSchema).optional(),
  gallery: z.array(imageSchema),
});

export type FormValues = z.infer<typeof formSchema>;

// Helper function to normalize sections for form (ensures description is always string)
function normalizeSectionsForForm(sections: Section[]): FormValues["sections"] {
  return sections.map((section) => ({
    ...section,
    description: section.description ?? "",
  }));
}

interface EventFormProps {
  initialData?: FormValues;
}

export default function EventForm({ initialData }: EventFormProps = {}) {
  const pathname = usePathname().split("/");
  const isEditing = pathname[pathname.length - 1] === "edit";
  const router = useRouter();
  // Extract current event ID from pathname (e.g., /events/[event]/edit or /events/[event])
  const currentEventId =
    (pathname[1] === "events" || pathname[1] === "competitions") && pathname[2]
      ? pathname[2]
      : undefined;

  const [activeMainTab, setActiveMainTab] = useState("Event Details");
  const [activeSectionId, setActiveSectionId] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  //TODO: set up logic for next buttons to use the active tab index

  // Initialize form with default values or initial data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    mode: "onSubmit",
    defaultValues: initialData || {
      eventDetails: {
        creatorId: "",
        title: "",
        city: {
          id: 0,
          name: "",
          countryCode: "",
          region: "",
          population: 0,
        },
        dates: [
          {
            date: "",
            startTime: "",
            endTime: "",
          },
        ],
        description: "",
        schedule: "",
        address: "",
        prize: "",
        entryCost: "",
        cost: "",
        poster: null,
        eventType: undefined,
      },
      sections: [],
      roles: [],
      gallery: [],
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    register,
    watch,
    trigger,
  } = form;

  const sections = watch("sections") ?? [];
  const eventDetails = watch("eventDetails");
  const roles = watch("roles") ?? [];
  const galleryRaw = watch("gallery") ?? [];
  // Normalize gallery to ensure all images have the type property
  const gallery: Image[] = galleryRaw.map((img) => ({
    ...img,
    type: ((img as any).type || "gallery") as "gallery" | "profile" | "poster",
  }));
  const activeSection = sections.find((s) => s.id === activeSectionId);

  // Auto-select first section when Sections tab is active and no section is selected
  useEffect(() => {
    if (activeMainTab === "Sections" && sections.length > 0) {
      // Check if current activeSectionId is invalid (doesn't match any section or is "0")
      const isValidSection = sections.some((s) => s.id === activeSectionId);
      if (!isValidSection || activeSectionId === "0") {
        setActiveSectionId(sections[0].id);
      }
    }
  }, [activeMainTab, sections, activeSectionId]);

  const mainTabs = [
    "Event Details",
    "Roles",
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
    setValue("sections", normalizeSectionsForForm([...sections, newSection]));
    setActiveSectionId(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    const updatedSections = sections.filter(
      (section) => section.id !== sectionId
    );
    setValue("sections", normalizeSectionsForForm(updatedSections));

    // If we removed the active section, switch to the first available section
    if (activeSectionId === sectionId && updatedSections.length > 0) {
      setActiveSectionId(updatedSections[0].id);
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
    console.log("Submitting Edit Event Form");
    console.log(data);
    setIsSubmitting(true);

    try {
      // Ensure creatorId is a string (will be overridden by session in server action, but needed for type safety)
      const normalizedData = {
        ...data,
        eventDetails: {
          ...data.eventDetails,
          creatorId: data.eventDetails.creatorId || "",
        },
      };

      let response;
      if (isEditing) {
        response = await editEvent(
          pathname[pathname.length - 2],
          normalizedData
        );
      } else {
        response = await addEvent(normalizedData);
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

          if (response.status === 200) {
            router.push(`/events/${pathname[pathname.length - 2]}`);
          } else {
            toast.error("Failed to update event", {
              description: "Please try again.",
            });
          }
        } else {
          toast.success("Event created successfully!", {
            description: "Your event has been created and is now live.",
          });

          if (response.event) {
            router.push(`/events/${response.event.id}`);
          } else {
            toast.error("Failed to submit event", {
              description: "Please try again.",
            });
          }
        }
      }
      // if non res error, log it
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: FieldErrors) => {
    console.error("Form validation errors:", errors);

    // ADD THIS: Get all current form values
    const currentValues = getValues();
    console.log("Current form values:", currentValues);

    // ADD THIS: Log the specific error paths and their values
    const invalidFields = getFieldNamesFromErrors(errors);
    console.log("Invalid field paths:", invalidFields);

    const tabMap: { [key: string]: string } = {
      eventDetails: "Event Details",
      sections: "Sections",
      roles: "Roles",
      gallery: "Photo Gallery",
    };

    // Map required fields to user-friendly names, including dynamic array fields
    const fieldDisplayNames: { [key: string]: string } = {
      "eventDetails.title": "Event Title",
      "eventDetails.dates": "Event Dates",
      "eventDetails.dates.date": "Event Date",
      "eventDetails.dates.startTime": "Start Time",
      "eventDetails.dates.endTime": "End Time",
      "eventDetails.city.name": "City Name",
      "eventDetails.city.countryCode": "Country Code",
      "eventDetails.city.region": "Region",
      "sections.title": "Section Title",
      "sections.videos.title": "Video Title",
      "sections.videos.src": "Video Source",
      "sections.brackets.title": "Bracket Title",
      "sections.brackets.videos.title": "Bracket Video Title",
      "sections.brackets.videos.src": "Bracket Video Source",
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
          } else if (genericField.includes("dates")) {
            if (genericField.endsWith(".date")) {
              displayName = fieldDisplayNames["eventDetails.dates.date"];
            } else if (genericField.endsWith(".startTime")) {
              displayName = fieldDisplayNames["eventDetails.dates.startTime"];
            } else if (genericField.endsWith(".endTime")) {
              displayName = fieldDisplayNames["eventDetails.dates.endTime"];
            } else {
              displayName = fieldDisplayNames["eventDetails.dates"];
            }
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

  // Find the index of the active tab
  const activeTabIndex = mainTabs.findIndex((tab) => tab === activeMainTab);

  // Handlers for Previous and Next buttons
  const handlePreviousTab = () => {
    if (activeTabIndex > 0) {
      setActiveMainTab(mainTabs[activeTabIndex - 1]);
    }
  };

  const handleNextTab = () => {
    if (activeTabIndex < mainTabs.length - 1) {
      setActiveMainTab(mainTabs[activeTabIndex + 1]);
    }
  };

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
                  getValues={getValues}
                  activeSectionIndex={activeSectionIndex}
                  activeSection={activeSection}
                  sections={sections}
                  activeSectionId={activeSectionId}
                  eventId={
                    isEditing ? pathname[pathname.length - 2] : undefined
                  }
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
                          const filesArray = Array.isArray(files)
                            ? files
                            : [files];
                          setValue(
                            "gallery",
                            filesArray.map((file) => ({
                              ...file,
                              type: "gallery" as const,
                            }))
                          );
                        } else {
                          setValue("gallery", []);
                        }
                      }}
                      className="bg-[#E8E7E7]"
                      maxFiles={10}
                      files={gallery || null}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          {/* Bottom Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              type="button"
              variant="destructive"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousTab}
              disabled={activeTabIndex === 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleNextTab}
              disabled={activeTabIndex === mainTabs.length - 1}
            >
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
