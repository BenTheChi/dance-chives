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
import { Section, EventDetails, Role, SubEvent, Picture } from "@/types/event";
import { Workshop, WorkshopDetails, WorkshopRole } from "@/types/workshop";
import { EventDetailsForm } from "./event-details-form";
import RolesForm from "./roles-form";
import { AVAILABLE_ROLES } from "@/lib/utils/roles";
import { SubEventForm } from "./subevent-form";
import UploadFile from "../ui/uploadfile";
import { addEvent, editEvent } from "@/lib/server_actions/event_actions";
import { usePathname, useRouter } from "next/navigation";
import { EmbeddedWorkshopForm } from "./embedded-workshop-form";

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
  taggedWinners: z.array(userSearchItemSchema).optional(),
  taggedDancers: z.array(userSearchItemSchema).optional(),
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
  hasBrackets: z.boolean(),
  videos: z.array(videoSchema),
  brackets: z.array(bracketSchema),
  styles: z.array(z.string()).optional(),
  applyStylesToVideos: z.boolean().optional(),
  winners: z.array(userSearchItemSchema).optional(),
});

const pictureSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.string(),
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
  // The year of this date should be between 1900 and 2300
  startDate: z
    .string()
    .min(1, "Start date is required")
    .regex(
      /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20|21|22|23)[0-9]{2}$/,
      "Event date must be in a valid format"
    ), // switch to min for all non-optional
  description: z.preprocess((val) => val ?? "", z.string()),
  schedule: z.preprocess((val) => val ?? "", z.string()),
  address: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  prize: z.string().optional(),
  entryCost: z.string().optional(),
  poster: pictureSchema.nullable().optional(),
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

const subEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Sub-event title is required"), // switch to min for all non-optional
  description: z.preprocess((val) => val ?? "", z.string()),
  schedule: z.preprocess((val) => val ?? "", z.string()),
  startDate: z
    .string()
    .min(1, "Start date is required")
    .regex(
      /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20|21|22|23)[0-9]{2}$/,
      "Sub event date must be in a valid format"
    ), // switch to min for all non-optional
  address: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  poster: pictureSchema.nullable().optional(),
});

const workshopDetailsSchema = z.object({
  creatorId: z.string().nullable().optional(),
  title: z.string().min(1, "Workshop title is required"),
  city: z.object({
    id: z.number(),
    name: z.string().min(1, "City name is required"),
    countryCode: z.string().min(1, "Country code is required"),
    region: z.string().min(1, "Region is required"),
    population: z.number(),
  }),
  startDate: z
    .string()
    .min(1, "Start date is required")
    .regex(
      /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20|21|22|23)[0-9]{2}$/,
      "Workshop date must be in a valid format"
    ),
  description: z.preprocess((val) => val ?? "", z.string().optional()),
  schedule: z.preprocess((val) => val ?? "", z.string().optional()),
  address: z.preprocess((val) => val ?? "", z.string().optional()),
  startTime: z.preprocess((val) => val ?? "", z.string().optional()),
  endTime: z.preprocess((val) => val ?? "", z.string().optional()),
  cost: z.preprocess((val) => val ?? "", z.string().optional()),
  poster: pictureSchema.nullable().optional(),
});

const workshopRoleSchema = z.object({
  id: z.string(),
  title: z.enum(["ORGANIZER", "TEACHER"]),
  user: userSearchItemSchema.nullable(),
});

const workshopSchema = z.object({
  id: z.string(),
  workshopDetails: workshopDetailsSchema,
  roles: z.preprocess((val) => {
    if (!val || !Array.isArray(val)) return val;
    // Normalize roles before validation
    // Accept users with either id or username (server will look up id from username if needed)
    return val.map((role: any) => {
      if (!role || !role.title) return role;
      return {
        id: role.id || Math.random().toString(36).substring(2, 9),
        title:
          role.title?.toUpperCase() === "ORGANIZER" ||
          role.title?.toUpperCase() === "TEACHER"
            ? role.title.toUpperCase()
            : role.title,
        user:
          role.user && role.user.username
            ? {
                id: role.user.id, // May be undefined, server will look it up
                displayName: role.user.displayName || "",
                username: role.user.username || "",
              }
            : null,
      };
    });
  }, z.array(workshopRoleSchema).optional()),
  videos: z.array(videoSchema),
  gallery: z.array(pictureSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  associatedEventId: z.string().optional(),
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
  subEvents: z.array(subEventSchema),
  workshops: z.array(workshopSchema),
  gallery: z.array(pictureSchema),
});

export type FormValues = z.infer<typeof formSchema>;

// Helper function to normalize sections for form (ensures description is always string)
function normalizeSectionsForForm(sections: Section[]): FormValues["sections"] {
  return sections.map((section) => ({
    ...section,
    description: section.description ?? "",
  }));
}

// Helper function to normalize subevents for form (ensures description and schedule are always string)
function normalizeSubEventsForForm(
  subEvents: SubEvent[]
): FormValues["subEvents"] {
  return subEvents.map((subEvent) => ({
    ...subEvent,
    description: subEvent.description ?? "",
    schedule: subEvent.schedule ?? "",
  }));
}

interface EventFormProps {
  initialData?: FormValues;
}

export default function EventForm({ initialData }: EventFormProps = {}) {
  const pathname = usePathname().split("/");
  const isEditing = pathname[pathname.length - 1] === "edit";
  const router = useRouter();

  const [activeMainTab, setActiveMainTab] = useState("Event Details");
  const [activeSectionId, setActiveSectionId] = useState("0");
  const [activeSubEventId, setActiveSubEventId] = useState("0");
  const [activeWorkshopId, setActiveWorkshopId] = useState("0");
  const [workshopTabs, setWorkshopTabs] = useState<Record<string, string>>({});
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
        startDate: "",
        description: "",
        schedule: "",
        address: "",
        startTime: "",
        endTime: "",
        prize: "",
        entryCost: "",
        poster: null,
      },
      sections: [],
      roles: [],
      subEvents: [],
      workshops: [],
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
  const subEvents = watch("subEvents") ?? [];
  const workshops = watch("workshops") ?? [];
  const roles = watch("roles") ?? [];
  const gallery = watch("gallery") ?? [];
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const activeSubEvent = subEvents.find((s) => s.id === activeSubEventId);
  const activeWorkshop = workshops.find((w) => w.id === activeWorkshopId);

  // Initialize workshop tabs and active workshop when workshops are loaded from initial data
  useEffect(() => {
    if (workshops.length > 0 && activeWorkshopId === "0") {
      // Set the first workshop as active
      setActiveWorkshopId(workshops[0].id);
      // Initialize all workshop tabs to "Workshop Details"
      const initialTabs: Record<string, string> = {};
      workshops.forEach((workshop) => {
        initialTabs[workshop.id] = "Workshop Details";
      });
      setWorkshopTabs(initialTabs);
    }
  }, [workshops, activeWorkshopId]);

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
    setValue(
      "subEvents",
      normalizeSubEventsForForm([...subEvents, newSubEvent])
    );
    setActiveSubEventId(newSubEvent.id);
  };

  const removeSubEvent = (subEventId: string) => {
    const updatedSubEvents = subEvents.filter((s) => s.id !== subEventId);
    setValue("subEvents", normalizeSubEventsForForm(updatedSubEvents));

    // If we removed the active subevent, switch to the first available subevent
    if (activeSubEventId === subEventId && updatedSubEvents.length > 0) {
      setActiveSubEventId(updatedSubEvents[0].id);
    }
  };

  const addWorkshop = () => {
    const newWorkshop: FormValues["workshops"][0] = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      workshopDetails: {
        creatorId: "",
        title: `New Workshop ${workshops.length + 1}`,
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
        cost: "",
        poster: null,
        city: {
          id: 0,
          name: "",
          countryCode: "",
          region: "",
          population: 0,
        },
      },
      roles: [],
      videos: [],
      gallery: [],
      associatedEventId: isEditing ? pathname[pathname.length - 2] : undefined,
    };
    setValue("workshops", [...workshops, newWorkshop]);
    setActiveWorkshopId(newWorkshop.id);
    // Initialize tab state for the new workshop
    setWorkshopTabs((prev) => ({
      ...prev,
      [newWorkshop.id]: "Workshop Details",
    }));
  };

  const removeWorkshop = (workshopId: string) => {
    const updatedWorkshops = workshops.filter((w) => w.id !== workshopId);
    setValue("workshops", updatedWorkshops);

    // Remove the tab state for the deleted workshop
    setWorkshopTabs((prev) => {
      const newTabs = { ...prev };
      delete newTabs[workshopId];
      return newTabs;
    });

    // If we removed the active workshop, switch to the first available workshop
    if (activeWorkshopId === workshopId && updatedWorkshops.length > 0) {
      setActiveWorkshopId(updatedWorkshops[0].id);
    } else if (updatedWorkshops.length === 0) {
      setActiveWorkshopId("0");
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
      // Also normalize workshop roles to ensure they have proper structure
      const normalizedData = {
        ...data,
        eventDetails: {
          ...data.eventDetails,
          creatorId: data.eventDetails.creatorId || "",
        },
        workshops: data.workshops?.map((workshop) => ({
          ...workshop,
          workshopDetails: {
            ...workshop.workshopDetails,
            creatorId: workshop.workshopDetails.creatorId || "",
          },
          roles:
            workshop.roles?.map((role) => ({
              id: role.id || Math.random().toString(36).substring(2, 9),
              title: (role.title?.toUpperCase() === "ORGANIZER" ||
              role.title?.toUpperCase() === "TEACHER"
                ? role.title.toUpperCase()
                : "ORGANIZER") as "ORGANIZER" | "TEACHER",
              user:
                role.user && role.user.username
                  ? {
                      id: role.user.id, // May be undefined, server will look it up
                      displayName: role.user.displayName || "",
                      username: role.user.username || "",
                    }
                  : null,
            })) || [],
        })),
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

    // ADD THIS: Specifically log workshop videos that might be causing issues
    const workshops = currentValues.workshops || [];
    console.log("Workshops data:", workshops);

    workshops.forEach((workshop, workshopIndex) => {
      if (workshop.videos && workshop.videos.length > 0) {
        console.log(
          `Workshop ${workshopIndex} (${workshop.id}) videos:`,
          workshop.videos
        );
        workshop.videos.forEach((video, videoIndex) => {
          console.log(`  Video ${videoIndex}:`, {
            id: video.id,
            title: video.title,
            src: video.src,
            srcLength: video.src?.length,
            srcType: typeof video.src,
            isEmpty: !video.src || video.src.trim() === "",
          });
        });
      }
    });

    // ADD THIS: Log the specific error paths and their values
    const invalidFields = getFieldNamesFromErrors(errors);
    console.log("Invalid field paths:", invalidFields);

    invalidFields.forEach((fieldPath) => {
      if (
        fieldPath.includes("workshops") &&
        fieldPath.includes("videos") &&
        fieldPath.includes("src")
      ) {
        // Extract indices from path like "workshops.0.videos.1.src"
        const match = fieldPath.match(/workshops\.(\d+)\.videos\.(\d+)\.src/);
        if (match) {
          const workshopIdx = parseInt(match[1]);
          const videoIdx = parseInt(match[2]);
          const value = getValues(
            `workshops.${workshopIdx}.videos.${videoIdx}.src`
          );
          console.log(`Field ${fieldPath} has value:`, {
            value,
            valueType: typeof value,
            isUndefined: value === undefined,
            isNull: value === null,
            isEmpty: value === "",
            length: value?.length,
          });
        }
      }
    });

    const tabMap: { [key: string]: string } = {
      eventDetails: "Event Details",
      sections: "Sections",
      subEvents: "SubEvents",
      workshops: "Workshops",
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
      "workshops.workshopDetails.title": "Workshop Title",
      "workshops.workshopDetails.startDate": "Workshop Date",
      "workshops.workshopDetails.city.name": "City Name",
      "workshops.workshopDetails.city.countryCode": "Country Code",
      "workshops.workshopDetails.city.region": "Region",
      "workshops.videos.title": "Video Title",
      "workshops.videos.src": "Video Source",
      "workshops.roles.title": "Role",
      "workshops.roles.user": "User",
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
          } else if (
            genericField.includes("workshops") &&
            genericField.includes("workshopDetails")
          ) {
            // Handle workshop details fields
            if (genericField.endsWith(".title"))
              displayName =
                fieldDisplayNames["workshops.workshopDetails.title"];
            else if (genericField.endsWith(".startDate"))
              displayName =
                fieldDisplayNames["workshops.workshopDetails.startDate"];
            else if (genericField.includes("city.name"))
              displayName =
                fieldDisplayNames["workshops.workshopDetails.city.name"];
            else if (genericField.includes("city.countryCode"))
              displayName =
                fieldDisplayNames["workshops.workshopDetails.city.countryCode"];
            else if (genericField.includes("city.region"))
              displayName =
                fieldDisplayNames["workshops.workshopDetails.city.region"];
          } else if (
            genericField.includes("workshops") &&
            genericField.includes("videos")
          ) {
            // Handle workshop video fields
            if (genericField.endsWith(".title"))
              displayName = fieldDisplayNames["workshops.videos.title"];
            else if (genericField.endsWith(".src"))
              displayName = fieldDisplayNames["workshops.videos.src"];
          } else if (
            genericField.includes("workshops") &&
            genericField.includes("roles")
          ) {
            // Handle workshop role fields
            if (genericField.endsWith(".title"))
              displayName = fieldDisplayNames["workshops.roles.title"];
            else if (genericField.endsWith(".user"))
              displayName = fieldDisplayNames["workshops.roles.user"];
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

  const activeWorkshopIndex = workshops.findIndex(
    (w) => w.id === activeWorkshopId
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

          {activeMainTab === "Subevents" && (
            <div className="space-y-6">
              {/* SubEvents Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Sub Events</h3>
                <div className="flex gap-2 items-center flex-wrap">
                  {subEvents.map((subEvent) => (
                    <div key={subEvent.id} className="relative group">
                      <Button
                        type="button"
                        variant={
                          activeSubEventId === subEvent.id
                            ? "default"
                            : "outline"
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
                  <div className="mt-4">
                    <SubEventForm
                      control={control}
                      setValue={setValue}
                      activeSubEventIndex={activeSubEventIndex}
                      activeSubEvent={activeSubEvent}
                      activeSubEventId={activeSubEventId}
                      register={register}
                    />
                  </div>
                )}
              </div>

              {/* Workshops Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Workshops</h3>
                <div className="flex gap-2 items-center flex-wrap">
                  {workshops.map((workshop) => (
                    <div key={workshop.id} className="relative group">
                      <Button
                        type="button"
                        variant={
                          activeWorkshopId === workshop.id
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setActiveWorkshopId(workshop.id)}
                        className="pr-8"
                      >
                        {workshop.workshopDetails.title}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWorkshop(workshop.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" onClick={addWorkshop} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Workshop
                  </Button>
                </div>

                {activeWorkshop && (
                  <div className="mt-4">
                    <EmbeddedWorkshopForm
                      control={control}
                      setValue={setValue}
                      getValues={getValues}
                      register={register}
                      activeWorkshopIndex={activeWorkshopIndex}
                      activeWorkshop={activeWorkshop}
                      activeWorkshopId={activeWorkshopId}
                      activeTab={
                        workshopTabs[activeWorkshopId] || "Workshop Details"
                      }
                      setActiveTab={(tab: string) => {
                        setWorkshopTabs((prev) => ({
                          ...prev,
                          [activeWorkshopId]: tab,
                        }));
                      }}
                      eventId={
                        isEditing ? pathname[pathname.length - 2] : undefined
                      }
                    />
                  </div>
                )}
              </div>
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
