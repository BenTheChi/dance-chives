"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { SectionForm } from "@/components/forms/section-form";
import { Section, EventDetails, Role } from "@/types/event";
import { DraggableSectionTabs } from "@/components/forms/draggable-section-tabs";
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
      "Exhibition",
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
    judges: z.array(userSearchItemSchema).optional(),
    bgColor: z.string().optional(),
    poster: imageSchema.nullable().optional(),
    position: z.number().optional(),
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
  .passthrough() // Allow extra fields that aren't in the schema to pass through
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
        message: "Date required",
        path: ["date"],
      });
    }

    if (!hasStart) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time required",
        path: ["startTime"],
      });
    }

    if (!hasEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time required",
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
  instagram: z.preprocess(
    (val) => {
      const normalized = normalizeInstagram(val as string | null | undefined);
      return normalized;
    },
    z.string().url().optional().or(z.literal(""))
  ),
  youtube: z.preprocess(
    (val) => {
      const normalized = normalizeYouTube(val as string | null | undefined);
      return normalized;
    },
    z.string().url().optional().or(z.literal(""))
  ),
  facebook: z.preprocess(
    (val) => {
      const normalized = normalizeFacebook(val as string | null | undefined);
      return normalized;
    },
    z.string().url().optional().or(z.literal(""))
  ),
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

// Schema for simple form fields (without sections)
const simpleFormSchema = z.object({
  eventDetails: eventDetailsSchema,
  roles: z.array(roleSchema).optional(),
  gallery: z.array(imageSchema),
});

// Separate schema for sections validation
const sectionsSchema = z.array(sectionSchema).refine(
  (sections) => {
    const titles = sections.map((s) => s.title.toLowerCase().trim());
    const uniqueTitles = new Set(titles);
    return uniqueTitles.size === titles.length;
  },
  {
    message: "Section titles must be unique within an event",
  }
);

// Full schema for final validation (combines simple form + sections)
const formSchema = simpleFormSchema.extend({
  sections: sectionsSchema,
});

export type FormValues = z.infer<typeof formSchema>;
export type SimpleFormValues = z.infer<typeof simpleFormSchema>;

type SectionsSelection =
  | { type: "sectionOverview"; sectionId: string }
  | { type: "sectionVideos"; sectionId: string }
  | { type: "sectionBrackets"; sectionId: string }
  | { type: "bracket"; sectionId: string; bracketId: string };

// Helper function to normalize sections for form (ensures description is always string)
// Used when loading sections from drafts, autofill, or playlist parsing
function normalizeSectionsForForm(sections: Section[]): Section[] {
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
  //TODO: set up logic for next buttons to use the active tab index

  // Initialize form with default values or initial data (without sections)
  const form = useForm<SimpleFormValues>({
    resolver: zodResolver(simpleFormSchema) as any,
    mode: "onSubmit",
    defaultValues: {
      eventDetails: initialData?.eventDetails || {
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
      roles: initialData?.roles ?? [],
      gallery: initialData?.gallery ?? [],
    },
  });

  // Sections managed separately with useState (no transformation issues)
  const [sections, setSections] = useState<Section[]>(
    initialData?.sections ?? []
  );

  // Active bracket per section (for sections with brackets) – used when dragging to switch tab
  const [activeBracketIdBySection, setActiveBracketIdBySection] = useState<
    Record<string, string>
  >({});

  // Helper function to update sections (replaces setValue("sections", ...))
  const updateSections = useCallback((newSections: Section[]) => {
    setSections(newSections);
  }, []);

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
      // Restore form data (without sections)
      reset({
        eventDetails: parsed.eventDetails,
        roles: parsed.roles,
        gallery: parsed.gallery,
      });
      // Restore sections separately
      if (parsed.sections) {
        setSections(parsed.sections);
      }
    } catch (error) {
      console.error(
        "Failed to parse event form draft from sessionStorage",
        error
      );
    }
  }, [isEditing, initialData, reset, setSections]);

  // Restore draft when editing an event (per-event storage)
  useEffect(() => {
    if (!isEditing || !eventId) return;
    if (typeof window === "undefined") return;

    const saved = sessionStorage.getItem(getEditDraftStorageKey(eventId));
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      // Restore form data (without sections)
      reset({
        eventDetails: parsed.eventDetails,
        roles: parsed.roles,
        gallery: parsed.gallery,
      });
      // Restore sections separately
      if (parsed.sections) {
        setSections(parsed.sections);
      }
    } catch (error) {
      console.error(
        "Failed to parse event form draft from sessionStorage",
        error
      );
    }
  }, [isEditing, eventId, reset, setSections]);

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

    const subscription = watch((formValue) => {
      try {
        // Combine form data with sections from state
        const fullData = {
          ...formValue,
          sections, // Include sections from state
        };
        sessionStorage.setItem(storageKey, JSON.stringify(fullData));
      } catch (error) {
        console.error(
          "Failed to save event form draft to sessionStorage",
          error
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [isEditing, initialData, watch, eventId, sections]);

  const clearDraft = () => {
    if (typeof window === "undefined") return;

    if (isEditing) {
      if (!eventId) return;
      sessionStorage.removeItem(getEditDraftStorageKey(eventId));
      return;
    }

    sessionStorage.removeItem(CREATE_DRAFT_STORAGE_KEY);
  };

  // Autofill handler (text-only; no poster from autofill)
  const handleAutofill = (data: any) => {
    try {
      const autofillOptions = {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false,
      };

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

        // Merge with existing sections (don't overwrite if sections already exist)
        if (sections.length === 0) {
          // Only set sections if there are no existing sections
          updateSections(normalizedSections);

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

  // Sections are now managed directly with useState - no sync needed
  // Use sections state directly for both rendering and DND operations
  const eventDetails = watch("eventDetails");
  const roles = watch("roles") ?? [];
  const galleryWatched = watch("gallery");

  // Normalize gallery images
  const gallery: Image[] = (galleryWatched ?? []).map((img) => ({
    ...img,
    type: ((img as Image).type || "gallery") as
      | "gallery"
      | "profile"
      | "poster",
  }));

  // Auto-select first section and default sidebar selection when Sections tab is active
  useEffect(() => {
    if (activeMainTab !== "Sections") return;

    // Check if there are pending autofill sections to apply
    if (pendingAutofillSectionsRef.current && sections.length === 0) {
      const pendingSections = pendingAutofillSectionsRef.current;
      // Ensure sections are properly normalized
      const normalizedPendingSections =
        normalizeSectionsForForm(pendingSections);
      updateSections(normalizedPendingSections);

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

    if (sections.length === 0) {
      setActiveSectionId("0");
      setSectionsSelection(null);
      return;
    }

    // Ensure activeSectionId is valid
    const isValidSection = sections.some((s) => s.id === activeSectionId);
    const targetSectionId = isValidSection ? activeSectionId : sections[0].id;

    if (!isValidSection || activeSectionId === "0") {
      setActiveSectionId(targetSectionId);
    }

    // Ensure sidebar selection points to a valid section
    if (
      !sectionsSelection ||
      !sections.some((s) => s.id === sectionsSelection.sectionId)
    ) {
      setSectionsSelection({
        type: "sectionOverview",
        sectionId: targetSectionId,
      });
    }
  }, [activeMainTab, sections, activeSectionId, sectionsSelection]);

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
    const updatedSections = [...sections, newSection];
    updateSections(updatedSections);
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
    updateSections(updatedSections);

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

  const handleSectionReorder = useCallback(
    (newOrder: Section[]) => {
      // Direct update - no transformation issues with useState!
      updateSections(newOrder);
    },
    [updateSections]
  );

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
    const mergedSections = mergeSections(sections, parsedSections);

    // Normalize sections for form
    const normalizedMergedSections = normalizeSectionsForForm(mergedSections);

    // Update both DND state and form state
    updateSections(normalizedMergedSections);

    // If we're on the Sections tab, activate the first section
    if (activeMainTab === "Sections" && normalizedMergedSections.length > 0) {
      // If no sections were active before, activate the first new section
      const previousSectionsCount = sections.length;
      if (previousSectionsCount === 0) {
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
      const previousSectionsCount = sections.length;
      if (previousSectionsCount === 0) {
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

  // Store cancel function reference
  const autofillCancelRef = useRef<(() => Promise<void>) | null>(null);

  // Poll for autofill job status at parent level to persist across tab navigation
  const { cancelJob } = useJobPolling<any>({
    jobId: autofillJobId,
    statusEndpoint: "/api/events/autofill/status",
    onComplete: (result) => {
      setIsAutofilling(false);
      setAutofillJobId(null);

      if (result && handleAutofill) {
        handleAutofill(result);
        toast.success("Event details autofilled successfully!");
      } else {
        toast.error("Invalid response from autofill API");
      }
    },
    onError: (errorMessage) => {
      setIsAutofilling(false);
      setAutofillJobId(null);
      if (errorMessage !== "Job cancelled by user") {
        toast.error(errorMessage);
      } else {
        toast.info("Autofill cancelled");
      }
    },
    enabled: !!autofillJobId,
    timeout: 60000, // 60 seconds timeout
    cancelEndpoint: "/api/events/autofill/cancel",
  });

  // Store cancel function in ref so it can be accessed by child component
  autofillCancelRef.current = cancelJob;

  const handleAutofillCancel = async () => {
    if (autofillCancelRef.current) {
      await autofillCancelRef.current();
    }
  };

  const handleAutofillJobStart = (jobId: string) => {
    setAutofillJobId(jobId);
    setIsAutofilling(true);
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

  const onSubmit = async (data: SimpleFormValues) => {
    setIsSubmitting(true);
    startSubmission();
    let navigating = false;

    try {
      // Combine sections state with form data
      // Normalize sections to match schema (ensure description is string, etc.)
      const normalizedSections = sections.map((section) => ({
        ...section,
        description: section.description ?? "",
        sectionType: section.sectionType ?? "Battle",
        bgColor: section.bgColor || "#ffffff",
      }));

      const fullFormData: FormValues = {
        ...data,
        sections: normalizedSections as FormValues["sections"],
      };

      // Validate combined data
      const validationResult = formSchema.safeParse(fullFormData);
      if (!validationResult.success) {
        // Handle validation errors - map to form errors
        const formattedErrors: FieldErrors = {};
        validationResult.error.errors.forEach((error) => {
          const path = error.path.join(".");
          if (path.startsWith("sections.")) {
            // Section errors - we'll handle these in onError
            // For now, just log them
            console.error("Section validation error:", path, error.message);
          } else {
            // Form field errors - set them on the form
            const fieldPath = path.split(".") as any;
            let current: any = formattedErrors;
            for (let i = 0; i < fieldPath.length - 1; i++) {
              if (!current[fieldPath[i]]) {
                current[fieldPath[i]] = {};
              }
              current = current[fieldPath[i]];
            }
            current[fieldPath[fieldPath.length - 1]] = {
              type: error.code,
              message: error.message,
            };
          }
        });

        // Set form errors for non-section fields
        Object.keys(formattedErrors).forEach((key) => {
          setValue(key as any, getValues(key as any), {
            shouldValidate: true,
            shouldTouch: true,
          });
        });

        // Trigger validation to show errors
        handleSubmit(
          () => {},
          (errors) => {
            onError(errors);
          }
        )();

        // Show toast for section errors if any
        const sectionErrors = validationResult.error.errors.filter(
          (e) => e.path[0] === "sections"
        );
        if (sectionErrors.length > 0) {
          toast.error("Please fix section errors before submitting");
        }

        return;
      }

      // Ensure creatorId is a string (will be overridden by session in server action, but needed for type safety)
      const normalizedData = {
        ...validationResult.data,
        eventDetails: {
          ...validationResult.data.eventDetails,
          creatorId: validationResult.data.eventDetails.creatorId || "",
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
        response = await editEvent(eventId, normalizedData as any);
      } else {
        response = await addEvent(normalizedData as any);
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
        <form onSubmit={handleSubmit(onSubmit as any, onError)}>
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
                <div className="flex justify-center">
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
                </div>
              )}
              <div className="mb-6">
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
                  <div className="flex flex-col md:flex-row md:flex-wrap justify-center items-center gap-2">
                    <DraggableSectionTabs
                      sections={sections}
                      activeSectionId={activeSectionId}
                      onSectionClick={(sectionId) => {
                        setActiveSectionId(sectionId);
                        setSectionsSelection({
                          type: "sectionOverview",
                          sectionId: sectionId,
                        });
                      }}
                      onSectionDelete={removeSection}
                      onReorder={handleSectionReorder}
                    />
                    <CirclePlusButton size="lg" onClick={addSection} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab Content */}
          {activeMainTab === "Details" && (
            <EventDetailsForm
              control={control as any}
              setValue={setValue as any}
              eventDetails={eventDetails as EventDetails}
              onAutofill={handleAutofill}
              parentAutofillJobId={autofillJobId}
              parentIsAutofilling={isAutofilling}
              onAutofillJobStart={handleAutofillJobStart}
              onAutofillCancel={handleAutofillCancel}
            />
          )}

          {activeMainTab === "Roles" && (
            <RolesForm
              setValue={setValue as any}
              roles={roles as Role[]}
              eventId={eventId}
            />
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
                    control: control as any,
                    setValue: setValue as any,
                    getValues: getValues as any,
                    activeSectionIndex: selectedSectionIndex,
                    activeSection: selectedSection,
                    sections: sections, // Use sections state directly
                    updateSections: updateSections, // Pass update function
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
                            externalActiveBracketId={
                              activeBracketIdBySection[selectedSection.id] ??
                              selectedSection.brackets?.[0]?.id ??
                              null
                            }
                            onActiveBracketChange={(bracketId) => {
                              setActiveBracketIdBySection((prev) => ({
                                ...prev,
                                [selectedSection.id]: bracketId,
                              }));
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
