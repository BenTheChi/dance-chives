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
import { Plus } from "lucide-react";
import { FieldErrors, useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { SessionDetails, SessionRole, SessionDate } from "@/types/session";
import { Image } from "@/types/image";
import { Video } from "@/types/video";
import { SessionDetailsForm } from "./session-details-form";
import SessionRolesForm from "./session-roles-form";
import { AVAILABLE_ROLES } from "@/lib/utils/roles";
import UploadFile from "../ui/uploadfile";
import { addSession, editSession } from "@/lib/server_actions/session_actions";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SessionVideoForm } from "./session-video-form";
import { DebouncedSearchMultiSelect } from "../ui/debounced-search-multi-select";

const userSearchItemSchema = z.object({
  id: z.string().optional(),
  displayName: z.string(),
  username: z.string(),
});

const videoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Video title is required"),
  src: z
    .string()
    .min(1, "Video source is required")
    .refine(
      (url) => {
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
  type: z.enum(["battle", "freestyle", "choreography", "class"]),
  styles: z.array(z.string()).optional(),
  taggedWinners: z.array(userSearchItemSchema).optional(),
  taggedDancers: z.array(userSearchItemSchema).optional(),
  taggedChoreographers: z.array(userSearchItemSchema).optional(),
  taggedTeachers: z.array(userSearchItemSchema).optional(),
});

const imageSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  file: z.instanceof(File).nullable(),
});

const sessionDateSchema = z
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
      const [startHours, startMinutes] = data.startTime.split(":").map(Number);
      const [endHours, endMinutes] = data.endTime.split(":").map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;
      return endTotal > startTotal;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

const sessionDetailsSchema = z.object({
  creatorId: z.string().nullable().optional(),
  title: z.string().min(1, "Session title is required"),
  city: z.object({
    id: z.number(),
    name: z.string().min(1, "City name is required"),
    countryCode: z.string().min(1, "Country code is required"),
    region: z.string().min(1, "Region is required"),
    population: z.number(),
  }),
  dates: z.array(sessionDateSchema).min(1, "At least one date is required"),
  description: z.string(),
  schedule: z.string(),
  address: z.string(),
  cost: z.string(),
  poster: imageSchema.nullable().optional(),
  styles: z.array(z.string()).optional(),
});

const sessionRoleSchema = z.object({
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

// Subevent schema - now just references to existing events
const subEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["competition", "workshop", "session"]),
  imageUrl: z.string().optional(),
  date: z.preprocess((val) => val ?? "", z.string()),
  city: z.preprocess((val) => val ?? "", z.string()),
  cityId: z.number().optional(),
  styles: z.array(z.string()).optional(),
});

const formSchema = z.object({
  sessionDetails: sessionDetailsSchema,
  roles: z.array(sessionRoleSchema).optional(),
  videos: z.array(videoSchema),
  gallery: z.array(imageSchema),
  subEvents: z.array(subEventSchema),
});

export type SessionFormValues = z.infer<typeof formSchema>;

// Helper function to normalize subevents for form - convert from BaseEvent[] to form format
function normalizeSubEventsForForm(
  subEvents?: Array<{
    id: string;
    title: string;
    type?: string;
    imageUrl?: string;
    date?: string;
    city?: string | { name?: string; id?: number };
    cityId?: number;
    styles?: string[];
  }>
): SessionFormValues["subEvents"] {
  if (!subEvents) return [];
  return subEvents.map((subEvent) => ({
    id: subEvent.id,
    title: subEvent.title,
    type:
      (subEvent.type as "competition" | "workshop" | "session") ||
      "competition",
    imageUrl: subEvent.imageUrl,
    date: subEvent.date || "",
    city: typeof subEvent.city === 'string' ? subEvent.city : subEvent.city?.name || "",
    cityId: subEvent.cityId || (typeof subEvent.city === 'object' && subEvent.city?.id) || undefined,
    styles: subEvent.styles || [],
  }));
}

interface SessionFormProps {
  initialData?: SessionFormValues;
}

export default function SessionForm({ initialData }: SessionFormProps = {}) {
  const pathname = usePathname()?.split("/") || [];
  const isEditing = pathname[pathname.length - 1] === "edit";
  const router = useRouter();
  // Extract current session ID from pathname (e.g., /sessions/[session]/edit or /sessions/[session])
  const currentEventId = pathname[1] === "sessions" && pathname[2] ? pathname[2] : undefined;

  const [activeMainTab, setActiveMainTab] = useState("Session Details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values or initial data
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: initialData
      ? {
          ...initialData,
          subEvents: initialData.subEvents || [],
        }
      : {
          sessionDetails: {
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
            cost: "",
            poster: null,
            styles: [],
          },
          roles: [],
          videos: [],
          gallery: [],
          subEvents: [],
        },
  });

  const { control, handleSubmit, setValue, getValues, register, watch } = form;

  const sessionDetails = watch("sessionDetails");
  const roles = watch("roles") ?? [];
  const videos = watch("videos") ?? [];
  const gallery = watch("gallery") ?? [];
  const subEvents = watch("subEvents") ?? [];
  const parentEvent = sessionDetails?.parentEvent;

  // Helper function to get parent event route
  const getParentEventRoute = (type?: string, id?: string) => {
    if (!id) return "#";
    switch (type) {
      case "workshop":
        return `/workshops/${id}`;
      case "session":
        return `/sessions/${id}`;
      case "competition":
      default:
        return `/events/${id}`;
    }
  };

  const mainTabs = ["Session Details", "Roles", "Subevents", "Videos", "Photo Gallery"];

  // Subevent selection handler - using DebouncedSearchMultiSelect
  const handleSubEventChange = (selectedEvents: SessionFormValues["subEvents"]) => {
    setValue("subEvents", selectedEvents);
  };

  const addVideo = () => {
    const newVideo = {
      id: Date.now().toString(),
      title: `Video ${videos.length + 1}`,
      src: "https://example.com/video",
      type: "battle" as const,
    };
    setValue("videos", [...videos, newVideo]);
  };

  const removeVideo = (videoId: string) => {
    setValue(
      "videos",
      videos.filter((v) => v.id !== videoId)
    );
  };

  // Extract field names from validation errors
  const getFieldNamesFromErrors = (errors: FieldErrors): string[] => {
    const fieldNames: string[] = [];

    const extractFieldNames = (obj: FieldErrors, prefix = "") => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === "object") {
          if (obj[key].message) {
            const fieldName = prefix ? `${prefix}.${key}` : key;
            fieldNames.push(fieldName);
          } else if (!obj[key].type) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            extractFieldNames(obj[key] as FieldErrors, newPrefix);
          }
        }
      }
    };

    extractFieldNames(errors);
    return fieldNames;
  };

  const onSubmit: SubmitHandler<SessionFormValues> = async (data) => {
    setIsSubmitting(true);

    try {
      const normalizedData = {
        ...data,
        sessionDetails: {
          ...data.sessionDetails,
          creatorId: data.sessionDetails.creatorId || "",
        },
      };

      let response;
      if (isEditing) {
        const sessionId = pathname[pathname.length - 2];
        response = await editSession(sessionId, normalizedData);
      } else {
        response = await addSession(normalizedData);
      }

      if (response.error) {
        if (isEditing) {
          toast.error("Failed to update session", {
            description: response.error,
          });
        } else {
          toast.error("Failed to create session", {
            description: response.error,
          });
        }
      } else {
        if (isEditing) {
          toast.success("Session updated successfully!", {
            description: "Your session has been updated and is now live.",
          });

          if (response.status === 200) {
            router.push(`/sessions/${pathname[pathname.length - 2]}`);
          } else {
            toast.error("Failed to update session", {
              description: "Please try again.",
            });
          }
        } else {
          toast.success("Session created successfully!", {
            description: "Your session has been created and is now live.",
          });

          if (response.session) {
            router.push(`/sessions/${response.session.id}`);
          } else {
            toast.error("Failed to submit session", {
              description: "Please try again.",
            });
          }
        }
      }
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

    const invalidFields = getFieldNamesFromErrors(errors);

    const tabMap: { [key: string]: string } = {
      sessionDetails: "Session Details",
      videos: "Videos",
      roles: "Roles",
      gallery: "Photo Gallery",
    };

    const fieldDisplayNames: { [key: string]: string } = {
      "sessionDetails.title": "Session Title",
      "sessionDetails.dates": "Session Dates",
      "sessionDetails.city.name": "City Name",
      "videos.title": "Video Title",
      "videos.src": "Video Source",
      "roles.title": "Role",
      "roles.user": "User",
    };

    const tabErrors: { [tab: string]: Set<string> } = {};

    for (const field of invalidFields) {
      const tabKey = Object.keys(tabMap).find((tab) => field.startsWith(tab));
      if (tabKey) {
        if (!tabErrors[tabKey]) tabErrors[tabKey] = new Set();
        let displayName = fieldDisplayNames[field];
        if (!displayName) {
          const genericField = field.replace(/\.(\d+)/g, "");
          if (genericField.includes("videos")) {
            if (genericField.endsWith(".title"))
              displayName = fieldDisplayNames["videos.title"];
            else if (genericField.endsWith(".src"))
              displayName = fieldDisplayNames["videos.src"];
          } else if (genericField.includes("title")) {
            displayName = fieldDisplayNames[`${tabKey}.title`];
          } else if (genericField.includes("dates")) {
            displayName = fieldDisplayNames[`${tabKey}.dates`];
          } else if (genericField.includes("user")) {
            displayName = fieldDisplayNames[`${tabKey}.user`];
          }
          if (!displayName)
            displayName = genericField.split(".").pop() || "Unknown Field";
        }
        tabErrors[tabKey].add(displayName);
      }
    }

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

  const activeTabIndex = mainTabs.findIndex((tab) => tab === activeMainTab);

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
        {isEditing ? "Edit Session" : "New Session"}
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
          {activeMainTab === "Session Details" && (
            <SessionDetailsForm
              control={control}
              setValue={setValue}
              sessionDetails={sessionDetails as SessionDetails}
              register={register}
            />
          )}

          {activeMainTab === "Roles" && (
            <SessionRolesForm
              control={control}
              setValue={setValue}
              roles={roles as SessionRole[]}
            />
          )}

          {activeMainTab === "Subevents" && (
            <div className="space-y-6">
              {isEditing && parentEvent ? (
                <Alert>
                  <AlertDescription>
                    This event is already the subevent of{" "}
                    <Link
                      href={getParentEventRoute(parentEvent.type, parentEvent.id)}
                      className="font-semibold text-primary hover:underline"
                    >
                      {parentEvent.title}
                    </Link>
                    . Remove this event as a subevent if you would like to make this the main event.
                  </AlertDescription>
                </Alert>
              ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Sub Events (Main Event)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select existing events to be subevents of this main event.
                  Subevents cannot have their own subevents.
                </p>

                <DebouncedSearchMultiSelect<
                  SessionFormValues["subEvents"][0] & {
                    displayName: string;
                    username: string;
                  }
                >
                  value={subEvents.map((se) => ({
                    ...se,
                    displayName: se.title,
                    username: se.id,
                  }))}
                  onChange={(values) => {
                    handleSubEventChange(
                      values.map((v) => ({
                        id: v.id,
                        title: v.title,
                        type: v.type,
                        imageUrl: v.imageUrl,
                        date: v.date,
                        city: v.city,
                        cityId: v.cityId,
                        styles: v.styles,
                      }))
                    );
                  }}
                  onSearch={async (keyword: string) => {
                      const url = new URL("/api/events/subevents", window.location.origin);
                      url.searchParams.set("keyword", keyword);
                      if (currentEventId) {
                        url.searchParams.set("excludeEventId", currentEventId);
                      }
                      const response = await fetch(url.toString());
                    const data = await response.json();
                    return (data.data || []).map(
                      (item: SessionFormValues["subEvents"][0]) => ({
                        ...item,
                        displayName: item.title,
                        username: item.id,
                      })
                    );
                  }}
                  getDisplayValue={(item) => item.title}
                  getItemId={(item) => item.id}
                  name="subEvents"
                  placeholder="Search for events to add as subevents..."
                  className="mb-6"
                />

                {/* Event Card Previews */}
                {subEvents.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-4">
                      Selected Subevents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subEvents.map((subEvent) => (
                        <div
                          key={subEvent.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="relative aspect-video overflow-hidden rounded-lg mb-3">
                            <img
                              src={subEvent.imageUrl || "/exploreEvents.jpg"}
                              alt={subEvent.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h5 className="font-semibold text-sm mb-1">
                            {subEvent.title}
                          </h5>
                          <p className="text-xs text-muted-foreground mb-2">
                            {subEvent.date} • {typeof subEvent.city === 'string' ? subEvent.city : (subEvent.city as any)?.name || ''}
                          </p>
                          {subEvent.styles && subEvent.styles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {subEvent.styles.slice(0, 3).map((style) => (
                                <span
                                  key={style}
                                  className="text-xs px-2 py-0.5 bg-secondary rounded"
                                >
                                  {style}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {activeMainTab === "Videos" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Videos</h3>
                <Button
                  type="button"
                  onClick={addVideo}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video, videoIndex) => (
                  <SessionVideoForm
                    key={video.id}
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    video={video}
                    videoIndex={videoIndex}
                    onRemove={() => removeVideo(video.id)}
                  />
                ))}
              </div>
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
                          setValue("gallery", files as Image[]);
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
            <Button type="button" variant="destructive" onClick={() => router.back()}>
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
              {isSubmitting ? "Submitting Session..." : "Finish"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
