"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { FieldErrors, useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { SectionForm } from "@/components/forms/section-form";
import { Section, EventDetails, Role, Bracket } from "@/types/event";
import { Image } from "@/types/image";
import { EventDetailsForm } from "./event-details-form";
import RolesForm from "./roles-form";
import { AVAILABLE_ROLES, RoleTitle } from "@/lib/utils/roles";
import UploadFile from "../ui/uploadfile";
import { addEvent, editEvent } from "@/lib/server_actions/event_actions";
import { usePathname, useRouter } from "next/navigation";
import { isTimeEmpty } from "@/lib/utils/event-utils";
import {
  SectionType,
  updateSectionType,
  sectionTypeRequiresBrackets,
  sectionTypeDisallowsBrackets,
} from "@/lib/utils/section-helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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

const imageSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.enum(["gallery", "profile", "poster"]).default("poster"),
  file: z.instanceof(File).nullable(),
  caption: z.string().optional(),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Section title is required"), // switch to min for all non-optional
  description: z.preprocess((val) => val ?? "", z.string()),
  sectionType: z.enum([
    "Battle",
    "Tournament",
    "Competition",
    "Performance",
    "Showcase",
    "Class",
    "Session",
    "Mixed",
    "Other",
  ]),
  hasBrackets: z.boolean(),
  videos: z.array(videoSchema),
  brackets: z.array(bracketSchema),
  styles: z.array(z.string()).optional(),
  applyStylesToVideos: z.boolean().optional(),
  winners: z.array(userSearchItemSchema).optional(),
  poster: imageSchema.nullable().optional(),
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
          isAllDay: z.boolean().default(true), // Form-only field, not stored in DB
          startTime: z.string().optional(),
          endTime: z.string().optional(),
        })
        .refine(
          (data) => {
            // If all-day, times should be empty (server will normalize)
            if (data.isAllDay) {
              return true;
            }
            // If not all-day, both times must be present and non-empty
            if (isTimeEmpty(data.startTime) || isTimeEmpty(data.endTime)) {
              return false;
            }
            // Validate that end time is after start time
            const [startHours, startMinutes] = (data.startTime || "")
              .split(":")
              .map(Number);
            const [endHours, endMinutes] = (data.endTime || "")
              .split(":")
              .map(Number);
            const startTotal = startHours * 60 + startMinutes;
            const endTotal = endHours * 60 + endMinutes;
            return endTotal > startTotal;
          },
          (data) => {
            // Custom error messages based on validation failure
            if (data.isAllDay) {
              return { message: "", path: [] };
            }
            if (isTimeEmpty(data.startTime) || isTimeEmpty(data.endTime)) {
              return {
                message:
                  "Both start time and end time are required when not all-day",
                path: ["startTime"],
              };
            }
            return {
              message: "End time must be after start time",
              path: ["endTime"],
            };
          }
        )
    )
    .min(1, "At least one event date is required"),
  description: z.preprocess((val) => val ?? "", z.string()),
  schedule: z.preprocess((val) => val ?? "", z.string()),
  location: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  cost: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  prize: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ),
  poster: imageSchema.nullable().optional(),
  originalPoster: imageSchema.nullable().optional(),
  bgColor: z.string().optional(),
  eventType: z.enum([
    "Battle",
    "Competition",
    "Class",
    "Workshop",
    "Session",
    "Party",
    "Festival",
    "Performance",
    "Other",
  ]),
  styles: z.array(z.string()).optional(),
});

const roleSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, "Role title is required")
    .refine(
      (val) => AVAILABLE_ROLES.includes(val as RoleTitle),
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

type SectionsSelection =
  | { type: "sectionOverview"; sectionId: string }
  | { type: "sectionVideos"; sectionId: string }
  | { type: "sectionBrackets"; sectionId: string }
  | { type: "bracket"; sectionId: string; bracketId: string };

// Helper function to normalize sections for form (ensures description is always string)
function normalizeSectionsForForm(sections: Section[]): FormValues["sections"] {
  return sections.map((section) => ({
    ...section,
    description: section.description ?? "",
    sectionType: section.sectionType ?? "Battle",
    poster: section.poster
      ? {
          ...section.poster,
          type: (section.poster.type || "poster") as "poster",
        }
      : null,
  }));
}

interface EventFormProps {
  initialData?: FormValues;
}

export default function EventForm({ initialData }: EventFormProps = {}) {
  const pathname = usePathname().split("/");
  const isEditing = pathname[pathname.length - 1] === "edit";
  const router = useRouter();

  const [activeMainTab, setActiveMainTab] = useState("Details");
  const [activeSectionId, setActiveSectionId] = useState("0");
  const [sectionsSelection, setSectionsSelection] =
    useState<SectionsSelection | null>(null);
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
            isAllDay: true,
            startTime: undefined,
            endTime: undefined,
          },
        ],
        description: "",
        schedule: "",
        location: "",
        cost: "",
        prize: "",
        poster: null,
        originalPoster: null,
        bgColor: "#ffffff",
        eventType: "Battle",
      },
      sections: [],
      roles: [],
      gallery: [],
    },
  });

  const { control, handleSubmit, setValue, getValues, register, watch } = form;

  // Ensure eventType is always set to a valid value
  useEffect(() => {
    const currentEventType = getValues("eventDetails.eventType");
    if (!currentEventType) {
      setValue("eventDetails.eventType", "Battle", { shouldValidate: false });
    }
  }, [getValues, setValue]);

  const sectionsRaw = watch("sections");
  const sections = sectionsRaw ?? [];
  const eventDetails = watch("eventDetails");
  const roles = watch("roles") ?? [];
  const galleryWatched = watch("gallery");

  // Memoize galleryRaw to prevent unnecessary re-renders
  const galleryRaw = useMemo(() => galleryWatched ?? [], [galleryWatched]);

  // Normalize and memoize gallery to prevent unnecessary re-renders
  const gallery: Image[] = useMemo(() => {
    return galleryRaw.map((img) => ({
      ...img,
      type: ((img as Image).type || "gallery") as
        | "gallery"
        | "profile"
        | "poster",
    }));
  }, [galleryRaw]);

  // Memoize sections to prevent unnecessary re-renders
  const sectionsMemo = useMemo(() => sectionsRaw ?? [], [sectionsRaw]);

  // Auto-select first section and default sidebar selection when Sections tab is active
  useEffect(() => {
    if (activeMainTab !== "Sections") return;

    if (sectionsMemo.length === 0) {
      setActiveSectionId("0");
      setSectionsSelection(null);
      return;
    }

    // Ensure activeSectionId is valid
    const isValidSection = sectionsMemo.some((s) => s.id === activeSectionId);
    const targetSectionId = isValidSection
      ? activeSectionId
      : sectionsMemo[0].id;

    if (!isValidSection || activeSectionId === "0") {
      setActiveSectionId(targetSectionId);
    }

    // Ensure sidebar selection points to a valid section
    if (
      !sectionsSelection ||
      !sectionsMemo.some((s) => s.id === sectionsSelection.sectionId)
    ) {
      setSectionsSelection({
        type: "sectionOverview",
        sectionId: targetSectionId,
      });
    }
  }, [activeMainTab, sectionsMemo, activeSectionId, sectionsSelection]);

  const mainTabs = ["Details", "Roles", "Sections", "Photo Gallery"];

  const addSection = () => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      title: `New Section ${sections.length + 1}`,
      description: "",
      sectionType: "Battle",
      hasBrackets: false,
      videos: [],
      brackets: [],
      poster: null,
    };
    setValue("sections", normalizeSectionsForForm([...sections, newSection]));
    setActiveSectionId(newSection.id);
    setSectionsSelection({
      type: "sectionOverview",
      sectionId: newSection.id,
    });
  };

  const removeSection = (sectionId: string) => {
    const updatedSections = sections.filter(
      (section) => section.id !== sectionId
    );
    setValue("sections", normalizeSectionsForForm(updatedSections));

    if (updatedSections.length === 0) {
      setActiveSectionId("0");
      setSectionsSelection(null);
      return;
    }

    // If we removed the active section, switch to the first available section
    if (activeSectionId === sectionId) {
      const nextSectionId = updatedSections[0].id;
      setActiveSectionId(nextSectionId);
      setSectionsSelection({
        type: "sectionOverview",
        sectionId: nextSectionId,
      });
      return;
    }

    // If current selection was pointing at the removed section, reset it
    if (sectionsSelection && sectionsSelection.sectionId === sectionId) {
      const nextSectionId = updatedSections[0].id;
      setSectionsSelection({
        type: "sectionOverview",
        sectionId: nextSectionId,
      });
    }
  };

  const updateSectionHasBrackets = (sectionId: string, checked: boolean) => {
    const currentSections = getValues("sections") ?? [];
    const updatedSections = currentSections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            hasBrackets: checked,
          }
        : section
    );

    setValue("sections", normalizeSectionsForForm(updatedSections), {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (
      !checked &&
      sectionsSelection &&
      sectionsSelection.sectionId === sectionId &&
      (sectionsSelection.type === "sectionBrackets" ||
        sectionsSelection.type === "bracket")
    ) {
      setSectionsSelection({
        type: "sectionVideos",
        sectionId,
      });
    } else if (
      checked &&
      sectionsSelection &&
      sectionsSelection.sectionId === sectionId &&
      sectionsSelection.type === "sectionVideos"
    ) {
      setSectionsSelection({
        type: "sectionBrackets",
        sectionId,
      });
    }
  };

  const addBracketFromSidebar = (sectionId: string) => {
    const currentSections = getValues("sections") ?? [];
    const sectionIndex = currentSections.findIndex(
      (section) => section.id === sectionId
    );
    if (sectionIndex === -1) return;

    const targetSection = currentSections[sectionIndex];

    // Only allow adding brackets when hasBrackets is true
    if (!targetSection.hasBrackets) return;

    const newBracket: Bracket = {
      id: Date.now().toString(),
      title: `New Bracket ${targetSection.brackets.length + 1}`,
      videos: [],
    };

    const updatedSections = currentSections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            brackets: [...section.brackets, newBracket],
          }
        : section
    );

    setValue("sections", normalizeSectionsForForm(updatedSections), {
      shouldValidate: true,
    });

    // Select the new bracket in the sidebar/navigation
    setActiveSectionId(sectionId);
    setSectionsSelection({
      type: "bracket",
      sectionId,
      bracketId: newBracket.id,
    });
  };

  const removeBracketFromSidebar = (sectionId: string, bracketId: string) => {
    const currentSections = getValues("sections") ?? [];
    const sectionIndex = currentSections.findIndex(
      (section) => section.id === sectionId
    );
    if (sectionIndex === -1) return;

    const targetSection = currentSections[sectionIndex];
    const updatedBrackets = targetSection.brackets.filter(
      (bracket) => bracket.id !== bracketId
    );

    const updatedSections = currentSections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            brackets: updatedBrackets,
          }
        : section
    );

    setValue("sections", normalizeSectionsForForm(updatedSections), {
      shouldValidate: true,
    });

    // Adjust selection if it was pointing at the removed bracket
    if (
      sectionsSelection &&
      sectionsSelection.type === "bracket" &&
      sectionsSelection.sectionId === sectionId &&
      sectionsSelection.bracketId === bracketId
    ) {
      if (updatedBrackets.length > 0) {
        setSectionsSelection({
          type: "bracket",
          sectionId,
          bracketId: updatedBrackets[0].id,
        });
      } else {
        setSectionsSelection({
          type: "sectionBrackets",
          sectionId,
        });
      }
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
      eventDetails: "Details",
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
    <div className="container mx-auto px-4 sm:px-4 py-6 max-w-full overflow-x-hidden">
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
                    : "border-transparent hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeMainTab === "Details" && (
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
              <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto w-full">
                {/* Left sidebar: sections + nested items - only show if sections exist */}
                {sections.length > 0 && (
                  <div className="w-full md:w-80 md:flex-shrink-0 ">
                    <div className="space-y-2 ">
                      {sections.map((section, sectionIndex) => {
                        const isActiveSection =
                          sectionsSelection?.sectionId === section.id ||
                          (!sectionsSelection &&
                            activeSectionId === section.id);

                        const handleSelectOverview = () => {
                          setActiveSectionId(section.id);
                          setSectionsSelection({
                            type: "sectionOverview",
                            sectionId: section.id,
                          });
                        };

                        const handleSelectVideos = () => {
                          setActiveSectionId(section.id);
                          setSectionsSelection({
                            type: "sectionVideos",
                            sectionId: section.id,
                          });
                        };

                        const handleSelectBracket = (bracketId: string) => {
                          setActiveSectionId(section.id);
                          setSectionsSelection({
                            type: "bracket",
                            sectionId: section.id,
                            bracketId,
                          });
                        };

                        const requiresBrackets = sectionTypeRequiresBrackets(
                          section.sectionType
                        );
                        const disallowsBrackets = sectionTypeDisallowsBrackets(
                          section.sectionType
                        );
                        const switchDisabled =
                          requiresBrackets || disallowsBrackets;
                        const switchChecked = requiresBrackets
                          ? true
                          : disallowsBrackets
                          ? false
                          : Boolean(section.hasBrackets);

                        return (
                          <div
                            key={section.id}
                            onClick={handleSelectOverview}
                            className={`rounded-sm cursor-pointer transition-colors relative ${
                              isActiveSection
                                ? "border-2 border-black bg-misty-seafoam shadow-[2px_2px_0_0_rgb(0,0,0)]"
                                : "border-2 border-black bg-misty-seafoam"
                            }`}
                          >
                            <div
                              className="px-3 py-2 space-y-2 rounded-sm"
                              onClick={(e) => {
                                // Only stop propagation for interactive elements
                                const target = e.target as HTMLElement;
                                const isInteractiveElement =
                                  target.tagName === "INPUT" ||
                                  target.tagName === "BUTTON" ||
                                  target.tagName === "SELECT" ||
                                  target.closest("button") !== null ||
                                  target.closest("[role='combobox']") !==
                                    null ||
                                  target.closest("[role='switch']") !== null ||
                                  target.closest("label") !== null;

                                if (isInteractiveElement) {
                                  e.stopPropagation();
                                }
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <FormField
                                  control={control}
                                  name={`sections.${sectionIndex}.title`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className="h-8 text-xs bg-white"
                                          placeholder="Section title"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSection(section.id);
                                  }}
                                  className="h-6 w-6 rounded-full p-0 text-destructive hover:text-destructive bg-transparent hover:bg-destructive/10"
                                  aria-label={`Remove ${section.title}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <Select
                                  value={
                                    (section.sectionType ||
                                      "Battle") as SectionType
                                  }
                                  onValueChange={(value) => {
                                    const currentSections =
                                      getValues("sections") ?? [];
                                    const updated = updateSectionType(
                                      currentSections,
                                      section.id,
                                      value as SectionType
                                    );
                                    setValue(
                                      "sections",
                                      normalizeSectionsForForm(updated),
                                      {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      }
                                    );
                                  }}
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Battle">
                                      Battle
                                    </SelectItem>
                                    <SelectItem value="Class">Class</SelectItem>
                                    <SelectItem value="Mixed">Mixed</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                    <SelectItem value="Performance">
                                      Performance
                                    </SelectItem>
                                    <SelectItem value="Session">
                                      Session
                                    </SelectItem>
                                    <SelectItem value="Showcase">
                                      Showcase
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2 text-xs">
                                  <Switch
                                    checked={switchChecked}
                                    disabled={switchDisabled}
                                    onCheckedChange={(checked) => {
                                      if (switchDisabled) return;
                                      updateSectionHasBrackets(
                                        section.id,
                                        checked
                                      );
                                    }}
                                    aria-label={`Toggle brackets for ${section.title}`}
                                  />
                                  <span>Use Brackets</span>
                                </div>
                              </div>
                            </div>

                            {isActiveSection && (
                              <div
                                className="border-t px-3 py-2 space-y-1 text-sm bg-misty-seafoam rounded-b relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={handleSelectOverview}
                                  className={`block w-full text-left rounded px-2 py-1 ${
                                    sectionsSelection?.type ===
                                      "sectionOverview" &&
                                    sectionsSelection.sectionId === section.id
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-muted"
                                  }`}
                                >
                                  Overview
                                </button>

                                {!section.hasBrackets && (
                                  <button
                                    type="button"
                                    onClick={handleSelectVideos}
                                    className={`block w-full text-left rounded px-2 py-1 ${
                                      sectionsSelection?.type ===
                                        "sectionVideos" &&
                                      sectionsSelection.sectionId === section.id
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                    }`}
                                  >
                                    Videos
                                    {section.videos.length > 0 && (
                                      <span className="ml-1 text-xs">
                                        ({section.videos.length})
                                      </span>
                                    )}
                                  </button>
                                )}

                                {section.hasBrackets && (
                                  <>
                                    <div
                                      className={`flex items-center justify-between rounded pl-2 py-1 ${
                                        sectionsSelection?.type ===
                                          "sectionBrackets" &&
                                        sectionsSelection.sectionId ===
                                          section.id
                                          ? "bg-primary/10 text-primary"
                                          : ""
                                      }`}
                                    >
                                      <span className="text-xs">
                                        Brackets
                                        {section.brackets.length > 0 && (
                                          <span className="ml-1 text-xs">
                                            ({section.brackets.length})
                                          </span>
                                        )}
                                      </span>
                                      <CirclePlusButton
                                        size="sm"
                                        onClick={() =>
                                          addBracketFromSidebar(section.id)
                                        }
                                        className="ml-1"
                                        aria-label={`Add bracket to ${section.title}`}
                                      />
                                    </div>

                                    {section.brackets.map((bracket) => {
                                      const isActiveBracketSelection =
                                        sectionsSelection?.type === "bracket" &&
                                        sectionsSelection.sectionId ===
                                          section.id &&
                                        sectionsSelection.bracketId ===
                                          bracket.id;
                                      return (
                                        <div
                                          key={bracket.id}
                                          className="flex items-center justify-between"
                                        >
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleSelectBracket(bracket.id)
                                            }
                                            className={`w-full text-left rounded pl-2 py-1 mx-2 text-xs ${
                                              isActiveBracketSelection
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted"
                                            }`}
                                          >
                                            {bracket.title}
                                            {bracket.videos.length > 0 && (
                                              <span className="ml-1 text-[10px]">
                                                ({bracket.videos.length} videos)
                                              </span>
                                            )}
                                          </button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              removeBracketFromSidebar(
                                                section.id,
                                                bracket.id
                                              )
                                            }
                                            className="ml-1 h-5 w-5 rounded-full p-0 text-destructive hover:text-destructive bg-transparent hover:bg-destructive/10"
                                            aria-label={`Remove ${bracket.title}`}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-center mt-6">
                      <CirclePlusButton size="lg" onClick={addSection} />
                    </div>
                  </div>
                )}

                {/* Right content pane */}
                <div
                  className={sections.length > 0 ? "flex-1 min-w-0" : "w-full"}
                >
                  {sections.length === 0 || !sectionsSelection ? (
                    <div className="border rounded-sm p-6 text-center max-w-3xl mx-auto w-full bg-misty-seafoam">
                      <div className="text-sm mb-6">
                        No sections yet. Let&apos;s create one!
                      </div>
                      <div className="flex justify-center">
                        <CirclePlusButton size="lg" onClick={addSection} />
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const selectedSection = sections.find(
                        (s) => s.id === sectionsSelection.sectionId
                      );
                      if (!selectedSection) {
                        return (
                          <div className="border rounded-sm p-6 text-sm">
                            The selected section no longer exists.
                          </div>
                        );
                      }

                      const selectedSectionIndex = sections.findIndex(
                        (s) => s.id === selectedSection.id
                      );
                      if (selectedSectionIndex === -1) {
                        return null;
                      }

                      const commonProps = {
                        control,
                        setValue,
                        getValues,
                        register,
                        activeSectionIndex: selectedSectionIndex,
                        activeSection: selectedSection,
                        sections,
                        activeSectionId: selectedSection.id,
                        eventId: isEditing
                          ? pathname[pathname.length - 2]
                          : undefined,
                      };

                      if (sectionsSelection.type === "sectionOverview") {
                        return <SectionForm {...commonProps} mode="overview" />;
                      }

                      if (sectionsSelection.type === "sectionVideos") {
                        return <SectionForm {...commonProps} mode="videos" />;
                      }

                      if (sectionsSelection.type === "sectionBrackets") {
                        return (
                          <SectionForm
                            {...commonProps}
                            mode="brackets"
                            externalActiveBracketId={null}
                            onActiveBracketChange={(bracketId) =>
                              setSectionsSelection({
                                type: "bracket",
                                sectionId: selectedSection.id,
                                bracketId,
                              })
                            }
                          />
                        );
                      }

                      if (sectionsSelection.type === "bracket") {
                        return (
                          <SectionForm
                            {...commonProps}
                            mode="brackets"
                            externalActiveBracketId={
                              sectionsSelection.bracketId
                            }
                            onActiveBracketChange={(bracketId) =>
                              setSectionsSelection({
                                type: "bracket",
                                sectionId: selectedSection.id,
                                bracketId,
                              })
                            }
                          />
                        );
                      }

                      return null;
                    })()
                  )}
                </div>
              </div>
            </div>
          )}

          {activeMainTab === "Photo Gallery" && (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
              <FormField
                control={control}
                name="gallery"
                render={() => (
                  <FormItem className="w-full">
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
                        enableCaptions={true}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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
