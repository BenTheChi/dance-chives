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
import {
  SessionDetails,
  SessionRole,
  Picture,
  Video,
  SessionDate,
} from "@/types/session";
import { SessionDetailsForm } from "./session-details-form";
import SessionRolesForm from "./session-roles-form";
import { AVAILABLE_ROLES } from "@/lib/utils/roles";
import UploadFile from "../ui/uploadfile";
import {
  addSession,
  editSession,
} from "@/lib/server_actions/session_actions";
import { usePathname, useRouter } from "next/navigation";
import { SessionVideoForm } from "./session-video-form";

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
  styles: z.array(z.string()).optional(),
});

const pictureSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.string(),
  file: z.instanceof(File).nullable(),
});

const sessionDateSchema = z.object({
  date: z
    .string()
    .min(1, "Date is required")
    .regex(
      /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20|21|22|23)[0-9]{2}$/,
      "Date must be in MM/DD/YYYY format"
    ),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
}).refine(
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
  dates: z
    .array(sessionDateSchema)
    .min(1, "At least one date is required"),
  description: z.string(),
  schedule: z.string(),
  address: z.string(),
  cost: z.string(),
  poster: pictureSchema.nullable().optional(),
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

const formSchema = z.object({
  sessionDetails: sessionDetailsSchema,
  roles: z.array(sessionRoleSchema).optional(),
  videos: z.array(videoSchema),
  gallery: z.array(pictureSchema),
});

export type SessionFormValues = z.infer<typeof formSchema>;

interface SessionFormProps {
  initialData?: SessionFormValues;
}

export default function SessionForm({
  initialData,
}: SessionFormProps = {}) {
  const pathname = usePathname()?.split("/") || [];
  const isEditing = pathname[pathname.length - 1] === "edit";
  const router = useRouter();

  const [activeMainTab, setActiveMainTab] = useState("Session Details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values or initial data
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: initialData
      ? {
          ...initialData,
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
        },
  });

  const { control, handleSubmit, setValue, getValues, register, watch } = form;

  const sessionDetails = watch("sessionDetails");
  const roles = watch("roles") ?? [];
  const videos = watch("videos") ?? [];
  const gallery = watch("gallery") ?? [];

  const mainTabs = ["Session Details", "Roles", "Videos", "Photo Gallery"];

  const addVideo = () => {
    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Video ${videos.length + 1}`,
      src: "https://example.com/video",
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
                          setValue("gallery", files as Picture[]);
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
              {isSubmitting ? "Submitting Session..." : "Finish"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

