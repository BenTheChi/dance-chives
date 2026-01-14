"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { X } from "lucide-react";
import { FieldErrors, useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { SectionForm } from "@/components/forms/section-form";
import { Section, EventDetails, Role } from "@/types/event";
import { Image } from "@/types/image";
import { EventDetailsForm } from "./event-details-form";
import RolesForm from "./roles-form";
import { AVAILABLE_ROLES, RoleTitle } from "@/lib/utils/roles";
import UploadFile from "../ui/uploadfile";
import { addEvent, editEvent } from "@/lib/server_actions/event_actions";
import { useSubmissionOverlay } from "@/components/SubmissionOverlay";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { isTimeEmpty } from "@/lib/utils/event-utils";
import { cn } from "@/lib/utils";
import { PlaylistParser } from "./playlist-parser";
import { useJobPolling } from "@/hooks/useJobPolling";
import { mergeSections } from "@/lib/playlist-parser-utils";
import { validateDanceStyles } from "@/lib/utils/dance-styles";

const CREATE_DRAFT_STORAGE_KEY = "event-form-draft";
const getEditDraftStorageKey = (eventId: string) =>
  `event-form-draft-${eventId}`;

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
    .enum(["battle", "freestyle", "choreography", "class", "other"])
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
  caption: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().optional()
  ),
});

// Helper functions to normalize social media links/usernames to full URLs
const normalizeInstagram = (
  input: string | undefined | null
): string | undefined => {
  if (!input || input.trim() === "") return undefined;
  const trimmed = input.trim();
  // If it's already a URL, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Remove @ if present and convert to URL
  const username = trimmed
    .replace(/^@/, "")
    .replace(/^instagram\.com\//, "")
    .trim();
  if (!username || username === "") return undefined;
  return `https://instagram.com/${username}`;
};

const normalizeYouTube = (
  input: string | undefined | null
): string | undefined => {
  if (!input || input.trim() === "") return undefined;
  const trimmed = input.trim();
  // If it's already a URL, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Remove @ if present and convert to URL
  const username = trimmed
    .replace(/^@/, "")
    .replace(/^youtube\.com\//, "")
    .replace(/^youtu\.be\//, "")
    .trim();
  if (!username || username === "") return undefined;
  return `https://youtube.com/@${username}`;
};

const normalizeFacebook = (
  input: string | undefined | null
): string | undefined => {
  if (!input || input.trim() === "") return undefined;
  const trimmed = input.trim();
  // If it's already a URL, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Remove @ if present and convert to URL
  const username = trimmed
    .replace(/^@/, "")
    .replace(/^facebook\.com\//, "")
    .replace(/^fb\.com\//, "")
    .trim();
  if (!username || username === "") return undefined;
  return `https://facebook.com/${username}`;
};

const dateRegex =
  /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20|21|22|23)[0-9]{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const sectionSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1, "Section title is required"), // switch to min for all non-optional
    description: z.preprocess((val) => val ?? "", z.string()),
    sectionType: z.enum([
      "Battle",
      "Competition",
      "Performance",
      "Showcase",
      "Class",
      "Session",
      "Party",
      "Other",
    ]),
    hasBrackets: z.boolean(),
    videos: z.array(videoSchema),
    brackets: z.array(bracketSchema),
    styles: z.array(z.string()).optional(),
    applyStylesToVideos: z.boolean().optional(),
    winners: z.array(userSearchItemSchema).optional(),
    bgColor: z.string().optional(),
    poster: imageSchema.nullable().optional(),
    date: z.preprocess((val) => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === "string" && val.trim().length === 0) return undefined;
      return val;
    }, z.string().regex(dateRegex, "Date must be in MM/DD/YYYY format").optional()),
    startTime: z.preprocess((val) => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === "string" && val.trim().length === 0) return undefined;
      return val;
    }, z.string().regex(timeRegex, "Start time must be in HH:MM format").optional()),
    endTime: z.preprocess((val) => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === "string" && val.trim().length === 0) return undefined;
      return val;
    }, z.string().regex(timeRegex, "End time must be in HH:MM format").optional()),
  })
  .superRefine((section, context) => {
    const hasDate = Boolean(section.date);
    const hasStart = Boolean(section.startTime);
    const hasEnd = Boolean(section.endTime);
    const anyProvided = hasDate || hasStart || hasEnd;

    if (!anyProvided) {
      return;
    }

    if (!hasDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date is required when adding a time",
        path: ["date"],
      });
    }

    if (!hasStart) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time is required when adding a date/time",
        path: ["startTime"],
      });
    }

    if (!hasEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time is required when adding a date/time",
        path: ["endTime"],
      });
    }
  });

const eventDetailsSchema = z.object({
  creatorId: z.string().nullable().optional(), // Set server-side from session, can be null
  title: z.string().min(1, "Event title is required"), // switch to min for all non-optional
  city: z.object({
    id: z.string().min(1, "City ID is required"),
    name: z.string().min(1, "City name is required"),
    countryCode: z.string().min(1, "Country code is required"),
    region: z.string().min(1, "Region is required"),
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
  website: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().url().optional().or(z.literal(""))
  ),
  instagram: z.preprocess((val) => {
    const normalized = normalizeInstagram(val as string | null | undefined);
    return normalized;
  }, z.string().url().optional().or(z.literal(""))),
  youtube: z.preprocess((val) => {
    const normalized = normalizeYouTube(val as string | null | undefined);
    return normalized;
  }, z.string().url().optional().or(z.literal(""))),
  facebook: z.preprocess((val) => {
    const normalized = normalizeFacebook(val as string | null | undefined);
    return normalized;
  }, z.string().url().optional().or(z.literal(""))),
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
    bgColor: section.bgColor || "#ffffff",
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
  const eventId = isEditing ? pathname[pathname.length - 2] : undefined;
  const router = useRouter();
  const { data: session } = useSession();

  // Check if user is Super Admin
  const isSuperAdmin =
    session?.user?.auth !== undefined &&
    session.user.auth >= AUTH_LEVELS.SUPER_ADMIN;

  const [activeMainTab, setActiveMainTab] = useState("Details");
  const [activeSectionId, setActiveSectionId] = useState("0");
  const [sectionsSelection, setSectionsSelection] =
    useState<SectionsSelection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startSubmission, endSubmission } = useSubmissionOverlay();
  // Store pending autofill sections data
  const pendingAutofillSectionsRef = useRef<Section[] | null>(null);
  // Playlist parser job state - managed at parent level to persist across tab navigation
  const [playlistJobId, setPlaylistJobId] = useState<string | null>(null);
  const [isParsingPlaylist, setIsParsingPlaylist] = useState(false);
  // Autofill job state - managed at parent level to persist across tab navigation
  const [autofillJobId, setAutofillJobId] = useState<string | null>(null);
  const [isAutofilling, setIsAutofilling] = useState(false);
  // Store poster file reference for autofill (needed when job completes)
  const autofillPosterFileRef = useRef<File | null>(null);
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
          id: "",
          name: "",
          countryCode: "",
          region: "",
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

  const { control, handleSubmit, setValue, getValues, register, watch, reset } =
    form;

  // Restore draft from sessionStorage on first load (creation only)
  useEffect(() => {
    if (isEditing || initialData) return;
    if (typeof window === "undefined") return;

    const saved = sessionStorage.getItem(CREATE_DRAFT_STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      reset(parsed);
    } catch (error) {
      console.error(
        "Failed to parse event form draft from sessionStorage",
        error
      );
    }
  }, [isEditing, initialData, reset]);

  // Restore draft when editing an event (per-event storage)
  useEffect(() => {
    if (!isEditing || !eventId) return;
    if (typeof window === "undefined") return;

    const saved = sessionStorage.getItem(getEditDraftStorageKey(eventId));
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      reset(parsed);
    } catch (error) {
      console.error(
        "Failed to parse event form draft from sessionStorage",
        error
      );
    }
  }, [isEditing, eventId, reset]);

  // Persist draft to sessionStorage on change (creation or edit)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let storageKey: string | null = null;
    if (isEditing) {
      if (!eventId) return;
      storageKey = getEditDraftStorageKey(eventId);
    } else if (!initialData) {
      storageKey = CREATE_DRAFT_STORAGE_KEY;
    } else {
      return;
    }

    const subscription = watch((value) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      } catch (error) {
        console.error(
          "Failed to save event form draft to sessionStorage",
          error
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [isEditing, initialData, watch, eventId]);

  const clearDraft = () => {
    if (typeof window === "undefined") return;

    if (isEditing) {
      if (!eventId) return;
      sessionStorage.removeItem(getEditDraftStorageKey(eventId));
      return;
    }

    sessionStorage.removeItem(CREATE_DRAFT_STORAGE_KEY);
  };

  // Autofill handler
  const handleAutofill = (data: any, posterFile: File | null) => {
    try {
      // Disable validation during autofill to avoid premature validation errors
      // Validation will happen when user interacts with fields or submits form
      const autofillOptions = {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false,
      };

      // Set poster if provided
      if (posterFile && posterFile instanceof File) {
        // Validate the File object is still valid
        if (posterFile.size === 0 || !posterFile.type?.startsWith("image/")) {
          console.warn("Invalid poster file from autofill:", {
            name: posterFile.name,
            size: posterFile.size,
            type: posterFile.type,
          });
          // Don't set the poster if the file is invalid
        } else {
          const posterImage: Image = {
            id: crypto.randomUUID(),
            title: posterFile.name,
            url: "", // Will be set when uploaded
            type: "poster",
            file: posterFile,
          };

          setValue("eventDetails.poster", posterImage, autofillOptions);
        }

        // Set default background color if not already set
        const currentBgColor = getValues("eventDetails.bgColor");
        if (!currentBgColor || currentBgColor === "#ffffff") {
          setValue("eventDetails.bgColor", "#ffffff", autofillOptions);
        }
      }

      // Validate and normalize styles
      const validStyles = data.styles
        ? validateDanceStyles(Array.isArray(data.styles) ? data.styles : [])
        : [];

      // Show warning if invalid styles were filtered out
      if (
        data.styles &&
        Array.isArray(data.styles) &&
        data.styles.length > validStyles.length
      ) {
        const invalidStyles = data.styles.filter(
          (style: string) => !validStyles.includes(style as any)
        );
        toast.warning(
          `Some dance styles were not recognized and were removed: ${invalidStyles.join(
            ", "
          )}`
        );
      }

      // Replace all form values
      setValue("eventDetails.title", data.title || "", autofillOptions);

      setValue(
        "eventDetails.eventType",
        data.eventType || "Battle",
        autofillOptions
      );

      // Set dates - ensure at least one date entry
      if (data.dates && Array.isArray(data.dates) && data.dates.length > 0) {
        setValue("eventDetails.dates", data.dates, autofillOptions);
      } else {
        // If no dates, set a default empty date
        setValue(
          "eventDetails.dates",
          [
            {
              date: "",
              isAllDay: true,
              startTime: undefined,
              endTime: undefined,
            },
          ],
          autofillOptions
        );
      }

      // Set string fields - convert null/undefined to empty strings
      setValue("eventDetails.location", data.location ?? "", autofillOptions);

      setValue(
        "eventDetails.description",
        data.description ?? "",
        autofillOptions
      );

      setValue("eventDetails.schedule", data.schedule ?? "", autofillOptions);

      setValue("eventDetails.cost", data.cost ?? "", autofillOptions);

      setValue("eventDetails.prize", data.prize ?? "", autofillOptions);

      // Set styles
      setValue("eventDetails.styles", validStyles, autofillOptions);

      // Set social media links - convert null/undefined to empty strings
      setValue("eventDetails.website", data.website ?? "", autofillOptions);

      setValue("eventDetails.instagram", data.instagram ?? "", autofillOptions);

      setValue("eventDetails.youtube", data.youtube ?? "", autofillOptions);

      setValue("eventDetails.facebook", data.facebook ?? "", autofillOptions);

      // Handle sections data if present
      if (
        data.sections &&
        Array.isArray(data.sections) &&
        data.sections.length > 0
      ) {
        // Normalize sections for form
        const normalizedSections = normalizeSectionsForForm(data.sections);

        // Get current sections
        const currentSections = getValues("sections") || [];

        // Merge with existing sections (don't overwrite if sections already exist)
        if (currentSections.length === 0) {
          // Only set sections if there are no existing sections
          setValue("sections", normalizedSections, {
            shouldValidate: false,
            shouldDirty: true,
            shouldTouch: false,
          });

          // If we're on the Sections tab, activate the first section
          if (activeMainTab === "Sections" && normalizedSections.length > 0) {
            setActiveSectionId(normalizedSections[0].id);
            setSectionsSelection({
              type: "sectionOverview",
              sectionId: normalizedSections[0].id,
            });
          }
        } else {
          // Store sections for later application when user navigates to Sections tab
          pendingAutofillSectionsRef.current = normalizedSections;
        }
      }

      // Note: City is left blank for manual selection as per plan
      // Note: Poster is not set from autofill - user uploads separately
    } catch (error) {
      console.error("Error applying autofill data:", error);
      toast.error("Failed to apply autofill data to form");
    }
  };

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

    // Check if there are pending autofill sections to apply
    if (pendingAutofillSectionsRef.current && sectionsMemo.length === 0) {
      const pendingSections = pendingAutofillSectionsRef.current;
      // Ensure sections are properly normalized
      const normalizedPendingSections =
        normalizeSectionsForForm(pendingSections);
      setValue("sections", normalizedPendingSections, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      // Activate the first section
      if (normalizedPendingSections.length > 0) {
        setActiveSectionId(normalizedPendingSections[0].id);
        setSectionsSelection({
          type: "sectionOverview",
          sectionId: normalizedPendingSections[0].id,
        });
      }

      // Clear pending sections
      pendingAutofillSectionsRef.current = null;
      return;
    }

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
  }, [
    activeMainTab,
    sectionsMemo,
    activeSectionId,
    sectionsSelection,
    setValue,
  ]);

  const mainTabs = ["Details", "Roles", "Sections", "Photo Gallery"];

  const addSection = () => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      title: `New Section ${sections.length + 1}`,
      description: "",
      sectionType: "Battle",
      hasBrackets: true,
      videos: [],
      brackets: [],
      bgColor: "#ffffff",
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

  const handlePlaylistParseSuccess = (parsedSections: Section[]) => {
    // Calculate detailed statistics for toast message
    const totalBrackets = parsedSections.reduce(
      (sum, section) => sum + (section.brackets?.length || 0),
      0
    );
    const totalVideosInBrackets = parsedSections.reduce(
      (sum, section) =>
        sum +
        (section.brackets?.reduce(
          (bracketSum, bracket) => bracketSum + (bracket.videos?.length || 0),
          0
        ) || 0),
      0
    );
    const totalDirectVideos = parsedSections.reduce(
      (sum, section) => sum + (section.videos?.length || 0),
      0
    );
    const totalVideos = totalVideosInBrackets + totalDirectVideos;

    // Build detailed toast message
    let message = `Successfully parsed ${totalVideos} video${
      totalVideos !== 1 ? "s" : ""
    } into ${parsedSections.length} section${
      parsedSections.length !== 1 ? "s" : ""
    }`;

    if (totalBrackets > 0) {
      message += ` with ${totalBrackets} bracket${
        totalBrackets !== 1 ? "s" : ""
      }`;
      if (totalVideosInBrackets > 0) {
        message += ` (${totalVideosInBrackets} video${
          totalVideosInBrackets !== 1 ? "s" : ""
        } in brackets)`;
      }
    }

    if (totalDirectVideos > 0) {
      message += ` and ${totalDirectVideos} direct video${
        totalDirectVideos !== 1 ? "s" : ""
      }`;
    }

    toast.success(message);

    // Merge parsed sections with existing sections using the merge utility
    const currentSections = sections;
    const mergedSections = mergeSections(currentSections, parsedSections);

    // Normalize sections for form
    const normalizedMergedSections = normalizeSectionsForForm(mergedSections);

    // Update form state
    setValue("sections", normalizedMergedSections, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // If we're on the Sections tab, activate the first section
    if (activeMainTab === "Sections" && normalizedMergedSections.length > 0) {
      // If no sections were active before, activate the first new section
      if (currentSections.length === 0) {
        setActiveSectionId(normalizedMergedSections[0].id);
        setSectionsSelection({
          type: "sectionOverview",
          sectionId: normalizedMergedSections[0].id,
        });
      } else {
        // If sections already existed, ensure active section is still valid
        const isValidSection = normalizedMergedSections.some(
          (s) => s.id === activeSectionId
        );
        if (!isValidSection || activeSectionId === "0") {
          setActiveSectionId(normalizedMergedSections[0].id);
          setSectionsSelection({
            type: "sectionOverview",
            sectionId: normalizedMergedSections[0].id,
          });
        }
      }
    } else if (normalizedMergedSections.length > 0) {
      // If we're not on the Sections tab, ensure the first section will be active when we navigate there
      // The useEffect for Sections tab will handle this, but we can also set it proactively
      if (currentSections.length === 0) {
        // Store the first section ID to activate when navigating to Sections tab
        // The useEffect will handle this, but setting it here ensures it's ready
        setActiveSectionId(normalizedMergedSections[0].id);
      }
    }
  };

  // Poll for playlist parsing job status at parent level to persist across tab navigation
  useJobPolling<{ sections: Section[] }>({
    jobId: playlistJobId,
    statusEndpoint: "/api/events/parse-playlist/status",
    onComplete: (result) => {
      setIsParsingPlaylist(false);
      setPlaylistJobId(null);

      if (result?.sections) {
        handlePlaylistParseSuccess(result.sections);
      }
    },
    onError: (errorMessage) => {
      setIsParsingPlaylist(false);
      setPlaylistJobId(null);
      toast.error(`Failed to parse playlist: ${errorMessage}`);
    },
    enabled: !!playlistJobId,
  });

  const handlePlaylistJobStart = (jobId: string) => {
    setPlaylistJobId(jobId);
    setIsParsingPlaylist(true);
  };

  // Poll for autofill job status at parent level to persist across tab navigation
  useJobPolling<any>({
    jobId: autofillJobId,
    statusEndpoint: "/api/events/autofill/status",
    onComplete: (result) => {
      setIsAutofilling(false);
      setAutofillJobId(null);

      if (result && handleAutofill) {
        // Pass both the data and the poster file
        handleAutofill(result, autofillPosterFileRef.current);
        toast.success("Event details autofilled successfully!");
        // Clear poster file reference
        autofillPosterFileRef.current = null;
      } else {
        const errorMessage = "Invalid response from autofill API";
        toast.error(errorMessage);
        autofillPosterFileRef.current = null;
      }
    },
    onError: (errorMessage) => {
      setIsAutofilling(false);
      setAutofillJobId(null);
      toast.error(errorMessage);
      autofillPosterFileRef.current = null;
    },
    enabled: !!autofillJobId,
  });

  const handleAutofillJobStart = (jobId: string, posterFile: File | null) => {
    setAutofillJobId(jobId);
    setIsAutofilling(true);
    // Store poster file reference for when job completes
    autofillPosterFileRef.current = posterFile;
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
    startSubmission();
    let navigating = false;

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
        if (!eventId) {
          toast.error("Failed to update event", {
            description: "Missing event id.",
          });
          return;
        }
        response = await editEvent(eventId, normalizedData);
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
            clearDraft();
            if (eventId) {
              router.push(`/events/${eventId}`);
              navigating = true;
              return; // allow overlay to stay until route change
            }
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
            clearDraft();
            router.push(`/events/${response.event.id}`);
            navigating = true;
            return; // allow overlay to stay until route change
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
      if (!navigating) {
        endSubmission();
        setIsSubmitting(false);
      }
    }
  };

  const onError = (errors: FieldErrors) => {
    console.error("Form validation errors:", errors);

    // ADD THIS: Get all current form values
    const currentValues = getValues();

    // ADD THIS: Log the specific error paths and their values
    const invalidFields = getFieldNamesFromErrors(errors);

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
    <div className="container mx-auto px-0 sm:px-4 py-6 max-w-full overflow-x-hidden">
      <h1 className="text-3xl font-bold text-center mb-8">
        {isEditing ? "Edit Event" : "New Event"}
      </h1>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit, onError)}>
          {/* Main Navigation - Text Style Tabs */}
          <div className="flex flex-col md:flex-row justify-center gap-2 mb-8">
            {mainTabs.map((tab) => {
              const isActive = activeMainTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveMainTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-sm transition-all duration-200",
                    "border-2 border-transparent",
                    "hover:border-charcoal hover:shadow-[4px_4px_0_0_rgb(49,49,49)]",
                    "active:shadow-[2px_2px_0_0_rgb(49,49,49)]",
                    "text-base font-bold uppercase tracking-wide",
                    "font-display",
                    isActive &&
                      "border-charcoal shadow-[4px_4px_0_0_rgb(49,49,49)] bg-mint text-primary",
                    !isActive &&
                      "text-secondary-light hover:bg-[#dfdfeb] hover:text-periwinkle"
                  )}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Section Tabs - Only show when Sections tab is active */}
          {activeMainTab === "Sections" && (
            <>
              {/* Playlist Parser - Super Admin Only */}
              {isSuperAdmin && (
                <PlaylistParser
                  formContext={{
                    title: eventDetails.title,
                    eventType: eventDetails.eventType,
                    socialLinks: {
                      instagram: eventDetails.instagram ?? undefined,
                      youtube: eventDetails.youtube ?? undefined,
                      facebook: eventDetails.facebook ?? undefined,
                    },
                    existingSections: sections,
                  }}
                  onParseSuccess={handlePlaylistParseSuccess}
                  parentPlaylistJobId={playlistJobId}
                  parentIsParsingPlaylist={isParsingPlaylist}
                  onPlaylistJobStart={handlePlaylistJobStart}
                />
              )}
              <div className="flex flex-col md:flex-row md:flex-wrap justify-center items-center gap-2 mb-6">
                {sections.length === 0 ? (
                  <div className="border rounded-sm p-6 text-center max-w-3xl mx-auto w-full bg-primary">
                    <div className="text-sm mb-6">
                      No sections yet. Let&apos;s create one!
                    </div>
                    <div className="flex justify-center">
                      <CirclePlusButton size="lg" onClick={addSection} />
                    </div>
                  </div>
                ) : (
                  <>
                    {sections.map((section, index) => {
                      const isActive = activeSectionId === section.id;
                      return (
                        <div
                          key={section.id}
                          className="relative group w-full md:w-auto"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSectionId(section.id);
                              setSectionsSelection({
                                type: "sectionOverview",
                                sectionId: section.id,
                              });
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-sm transition-all duration-200 w-full md:w-auto",
                              "border-2 border-transparent",
                              "group-hover:border-charcoal group-hover:shadow-[4px_4px_0_0_rgb(49,49,49)]",
                              "active:shadow-[2px_2px_0_0_rgb(49,49,49)]",
                              "text-sm font-bold uppercase tracking-wide",
                              "font-display",
                              isActive &&
                                "border-charcoal shadow-[4px_4px_0_0_rgb(49,49,49)] bg-mint text-primary",
                              !isActive &&
                                "text-secondary-light group-hover:bg-[#dfdfeb] group-hover:text-periwinkle"
                            )}
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {section.title || `Section ${index + 1}`}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSection(section.id);
                            }}
                            className={cn(
                              "absolute -top-2 -right-2",
                              "w-5 h-5 rounded-full",
                              "bg-destructive text-destructive-foreground",
                              "border-2 border-charcoal",
                              "flex items-center justify-center",
                              "opacity-0 group-hover:opacity-100",
                              "transition-opacity duration-200",
                              "hover:bg-destructive/90",
                              "z-10",
                              "shadow-[2px_2px_0_0_rgb(49,49,49)]"
                            )}
                            aria-label={`Delete ${section.title || "section"}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    <CirclePlusButton size="lg" onClick={addSection} />
                  </>
                )}
              </div>
            </>
          )}

          {/* Tab Content */}
          {activeMainTab === "Details" && (
            <EventDetailsForm
              control={control}
              setValue={setValue}
              eventDetails={eventDetails as EventDetails}
              onAutofill={handleAutofill}
              parentAutofillJobId={autofillJobId}
              parentIsAutofilling={isAutofilling}
              onAutofillJobStart={handleAutofillJobStart}
            />
          )}

          {activeMainTab === "Roles" && (
            <RolesForm setValue={setValue} roles={roles as Role[]} />
          )}

          {activeMainTab === "Sections" && (
            <div className="space-y-6">
              {sections.length === 0 ? (
                <></>
              ) : (
                (() => {
                  const selectedSection = sections.find(
                    (s) => s.id === activeSectionId
                  );
                  if (!selectedSection) {
                    return (
                      <div className="border rounded-sm p-6 text-sm">
                        Please select a section.
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
                    eventId: isEditing ? eventId : undefined,
                  };

                  return (
                    <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto w-full">
                      {/* Left Column: Section Overview */}
                      <div className="w-full md:w-1/2 md:flex-shrink-0">
                        <SectionForm {...commonProps} mode="overview" />
                      </div>

                      {/* Right Column: Videos or Brackets */}
                      <div className="w-full md:w-1/2 md:flex-shrink-0">
                        {selectedSection.hasBrackets ? (
                          <SectionForm
                            {...commonProps}
                            mode="brackets"
                            externalActiveBracketId={null}
                            onActiveBracketChange={() => {
                              // Keep track of active bracket but don't change selection type
                            }}
                          />
                        ) : (
                          <SectionForm {...commonProps} mode="videos" />
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
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
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                clearDraft();
                router.back();
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreviousTab}
              disabled={activeTabIndex === 0}
              className="w-full sm:w-auto"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleNextTab}
              disabled={activeTabIndex === mainTabs.length - 1}
              className="w-full sm:w-auto"
            >
              Next
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Submitting Event..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
