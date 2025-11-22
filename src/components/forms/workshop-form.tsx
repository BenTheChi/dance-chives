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
import { FieldErrors, useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { WorkshopDetails, WorkshopRole } from "@/types/workshop";
import { Image } from "@/types/image";
import { Video } from "@/types/video";
import { WorkshopDetailsForm } from "./workshop-details-form";
import WorkshopRolesForm from "./workshop-roles-form";
import { WORKSHOP_ROLES } from "@/lib/utils/roles";
import UploadFile from "../ui/uploadfile";
import {
  addWorkshop,
  editWorkshop,
} from "@/lib/server_actions/workshop_actions";
import { usePathname, useRouter } from "next/navigation";
import { WorkshopVideoForm } from "./workshop-video-form";
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
  description: z.string(),
  schedule: z.string(),
  address: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  cost: z.string(),
  poster: imageSchema.nullable().optional(),
  styles: z.array(z.string()).optional(),
});

const workshopRoleSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1, "Role title is required")
    .refine(
      (val) => WORKSHOP_ROLES.includes(val as any),
      `Role must be one of: ${WORKSHOP_ROLES.join(", ")}`
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
  workshopDetails: workshopDetailsSchema,
  roles: z.array(workshopRoleSchema).optional(),
  videos: z.array(videoSchema),
  gallery: z.array(imageSchema),
  subEvents: z.array(subEventSchema),
});

export type WorkshopFormValues = z.infer<typeof formSchema>;

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
): WorkshopFormValues["subEvents"] {
  if (!subEvents) return [];
  return subEvents.map((subEvent) => ({
    id: subEvent.id,
    title: subEvent.title,
    type:
      (subEvent.type as "competition" | "workshop" | "session") ||
      "competition",
    imageUrl: subEvent.imageUrl,
    date: subEvent.date || "",
    city:
      typeof subEvent.city === "string"
        ? subEvent.city
        : subEvent.city?.name || "",
    cityId:
      subEvent.cityId ||
      (typeof subEvent.city === "object" && subEvent.city?.id) ||
      undefined,
    styles: subEvent.styles || [],
  }));
}

interface WorkshopFormProps {
  initialData?: WorkshopFormValues;
}

export default function WorkshopForm({ initialData }: WorkshopFormProps = {}) {
  const pathname = usePathname()?.split("/") || [];
  const isEditing = pathname[pathname.length - 1] === "edit";
  const router = useRouter();
  // Extract current workshop ID from pathname (e.g., /workshops/[workshop]/edit or /workshops/[workshop])
  const currentEventId = pathname[1] === "workshops" && pathname[2] ? pathname[2] : undefined;

  const [activeMainTab, setActiveMainTab] = useState("Workshop Details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values or initial data
  const form = useForm<WorkshopFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: initialData
      ? {
          ...initialData,
          subEvents: initialData.subEvents || [],
        }
      : {
          workshopDetails: {
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

  const workshopDetails = watch("workshopDetails");
  const roles = watch("roles") ?? [];
  const videos = watch("videos") ?? [];
  const galleryRaw = watch("gallery") ?? [];
  const subEvents = watch("subEvents") ?? [];
  // Normalize gallery to ensure all images have the type property
  const gallery: Image[] = galleryRaw.map((img) => ({
    ...img,
    type: ((img as any).type || "gallery") as "gallery" | "profile" | "poster",
  }));

  const mainTabs = [
    "Workshop Details",
    "Roles",
    "Subevents",
    "Videos",
    "Photo Gallery",
  ];

  // Subevent selection handler - using DebouncedSearchMultiSelect
  const handleSubEventChange = (
    selectedEvents: WorkshopFormValues["subEvents"]
  ) => {
    setValue("subEvents", selectedEvents);
  };

  const addVideo = () => {
    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Video ${videos.length + 1}`,
      src: "https://example.com/video",
      type: "battle",
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

  const onSubmit: SubmitHandler<WorkshopFormValues> = async (data) => {
    console.log(data.workshopDetails.city);
    setIsSubmitting(true);

    try {
      const normalizedData = {
        ...data,
        workshopDetails: {
          ...data.workshopDetails,
          creatorId: data.workshopDetails.creatorId || "",
        },
      };

      let response;
      if (isEditing) {
        const workshopId = pathname[pathname.length - 2];
        response = await editWorkshop(workshopId, normalizedData);
      } else {
        response = await addWorkshop(normalizedData);
      }

      if (response.error) {
        if (isEditing) {
          toast.error("Failed to update workshop", {
            description: response.error,
          });
        } else {
          toast.error("Failed to create workshop", {
            description: response.error,
          });
        }
      } else {
        if (isEditing) {
          toast.success("Workshop updated successfully!", {
            description: "Your workshop has been updated and is now live.",
          });

          if (response.status === 200) {
            router.push(`/workshops/${pathname[pathname.length - 2]}`);
          } else {
            toast.error("Failed to update workshop", {
              description: "Please try again.",
            });
          }
        } else {
          toast.success("Workshop created successfully!", {
            description: "Your workshop has been created and is now live.",
          });

          if (response.workshop) {
            router.push(`/workshops/${response.workshop.id}`);
          } else {
            toast.error("Failed to submit workshop", {
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
      workshopDetails: "Workshop Details",
      videos: "Videos",
      roles: "Roles",
      gallery: "Photo Gallery",
    };

    const fieldDisplayNames: { [key: string]: string } = {
      "workshopDetails.title": "Workshop Title",
      "workshopDetails.startDate": "Workshop Date",
      "workshopDetails.city.name": "City Name",
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
          } else if (genericField.includes("startDate")) {
            displayName = fieldDisplayNames[`${tabKey}.startDate`];
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
        {isEditing ? "Edit Workshop" : "New Workshop"}
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
          {activeMainTab === "Workshop Details" && (
            <WorkshopDetailsForm
              control={control}
              setValue={setValue}
              workshopDetails={workshopDetails as WorkshopDetails}
              register={register}
            />
          )}

          {activeMainTab === "Roles" && (
            <WorkshopRolesForm
              control={control}
              setValue={setValue}
              roles={roles as WorkshopRole[]}
            />
          )}

          {activeMainTab === "Subevents" && (
            <div className="space-y-6">
              {/* SubEvents Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Sub Events (Main Event)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select existing events to be subevents of this main event.
                  Subevents cannot have their own subevents.
                </p>

                <DebouncedSearchMultiSelect<
                  WorkshopFormValues["subEvents"][0] & {
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
                      (item: WorkshopFormValues["subEvents"][0]) => ({
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
                            {subEvent.date} •{" "}
                            {typeof subEvent.city === "string"
                              ? subEvent.city
                              : (subEvent.city as any)?.name || ""}
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
                  <WorkshopVideoForm
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
              {isSubmitting ? "Submitting Workshop..." : "Finish"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
