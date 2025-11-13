"use client";

import { useEffect } from "react";
import {
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { WorkshopDetails, WorkshopRole } from "@/types/workshop";
import { UserSearchItem } from "@/types/user";
import { FormValues } from "./event-form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { WorkshopDetailsForm } from "./workshop-details-form";
import EmbeddedWorkshopRolesForm from "./embedded-workshop-roles-form";
import { WorkshopVideoForm } from "./workshop-video-form";
import { Video } from "@/types/event";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import UploadFile from "../ui/uploadfile";
import { Picture } from "@/types/event";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { toNeo4jRoleFormat } from "@/lib/utils/roles";

interface EmbeddedWorkshopFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  getValues: UseFormGetValues<FormValues>;
  register: UseFormRegister<FormValues>;
  activeWorkshopIndex: number;
  activeWorkshop: FormValues["workshops"][0];
  activeWorkshopId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  eventId?: string;
}

export function EmbeddedWorkshopForm({
  control,
  setValue,
  getValues,
  register,
  activeWorkshopIndex,
  activeWorkshop,
  activeWorkshopId,
  activeTab,
  setActiveTab,
  eventId,
}: EmbeddedWorkshopFormProps) {
  const tabs = ["Workshop Details", "Roles", "Videos", "Photo Gallery"];

  const videos = activeWorkshop.videos || [];
  // Roles should already be in uppercase format from the form schema, but normalize to ensure consistency
  // Also ensure each role has required fields (id, title, user)
  const roles = (activeWorkshop.roles || [])
    .filter((role) => role && role.title) // Filter out invalid roles
    .map((role) => ({
      id: role.id || Math.random().toString(36).substring(2, 9), // Ensure id exists
      title: toNeo4jRoleFormat(role.title) as "ORGANIZER" | "TEACHER",
      user:
        role.user && role.user.username
          ? {
              id: role.user.id, // May be undefined, server will look it up
              displayName: role.user.displayName || "",
              username: role.user.username || "",
            }
          : null,
    }));
  const gallery = activeWorkshop.gallery || [];

  // Normalize roles in form state when workshop changes to ensure validation passes
  useEffect(() => {
    if (!activeWorkshopId || activeWorkshopId === "0") return;

    const currentWorkshops = getValues("workshops") || [];
    const currentWorkshop = currentWorkshops.find(
      (w) => w.id === activeWorkshopId
    );

    if (
      currentWorkshop &&
      currentWorkshop.roles &&
      currentWorkshop.roles.length > 0
    ) {
      // Check if roles need normalization
      const needsNormalization = currentWorkshop.roles.some((role) => {
        if (!role || !role.title) return true;
        const normalizedTitle = toNeo4jRoleFormat(role.title);
        return (
          role.title !== normalizedTitle ||
          !role.id ||
          (role.user && (!role.user.displayName || !role.user.username))
        );
      });

      if (needsNormalization) {
        const normalizedRoles = currentWorkshop.roles
          .filter((role) => role && role.title)
          .map((role) => ({
            id: role.id || Math.random().toString(36).substring(2, 9),
            title: toNeo4jRoleFormat(role.title) as "ORGANIZER" | "TEACHER",
            user:
              role.user && role.user.username
                ? {
                    id: role.user.id, // May be undefined, server will look it up
                    displayName: role.user.displayName || "",
                    username: role.user.username || "",
                  }
                : null,
          }));

        const updatedWorkshops = currentWorkshops.map((w) =>
          w.id === activeWorkshopId ? { ...w, roles: normalizedRoles } : w
        );
        setValue("workshops", updatedWorkshops, { shouldValidate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkshopId]);

  const addVideo = () => {
    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Video ${videos.length + 1}`,
      src: "https://example.com/video",
    };
    const currentWorkshops = getValues("workshops") || [];
    const updatedWorkshops = currentWorkshops.map((w) =>
      w.id === activeWorkshopId
        ? { ...w, videos: [...(w.videos || []), newVideo] }
        : w
    );
    setValue("workshops", updatedWorkshops);
  };

  const removeVideo = (videoId: string) => {
    const currentWorkshops = getValues("workshops") || [];
    const updatedWorkshops = currentWorkshops.map((w) =>
      w.id === activeWorkshopId
        ? { ...w, videos: (w.videos || []).filter((v) => v.id !== videoId) }
        : w
    );
    setValue("workshops", updatedWorkshops);
  };

  const addGalleryImage = () => {
    const newImage: Picture = {
      id: Date.now().toString(),
      title: `Image ${gallery.length + 1}`,
      url: "",
      type: "image",
      file: null,
    };
    const currentWorkshops = getValues("workshops") || [];
    const updatedWorkshops = currentWorkshops.map((w) =>
      w.id === activeWorkshopId
        ? { ...w, gallery: [...(w.gallery || []), newImage] }
        : w
    );
    setValue("workshops", updatedWorkshops);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workshop Configuration</CardTitle>
        {/* Tab Navigation */}
        <div className="flex gap-4 mt-4 border-b">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTab === "Workshop Details" && (
          <div className="space-y-4">
            {/* Create a wrapper control that maps field paths correctly */}
            {(() => {
              // Create a wrapper control that maps workshopDetails.* to workshops.{index}.workshopDetails.*
              const workshopDetailsControl = new Proxy(control, {
                get(target, prop) {
                  const originalValue = (target as any)[prop];

                  // Intercept _getWatch to map field paths for reading values
                  if (prop === "_getWatch") {
                    return (name: string) => {
                      if (name && name.startsWith("workshopDetails.")) {
                        const mappedPath = `workshops.${activeWorkshopIndex}.workshopDetails.${name.replace(
                          "workshopDetails.",
                          ""
                        )}`;
                        return target._getWatch(mappedPath);
                      }
                      return target._getWatch(name);
                    };
                  }

                  // Intercept _formValues to map field paths
                  if (prop === "_formValues") {
                    const formValues = target._formValues;
                    return new Proxy(formValues, {
                      get(formValuesTarget, formValuesProp) {
                        if (formValuesProp === "get") {
                          return (name: string) => {
                            if (name && name.startsWith("workshopDetails.")) {
                              const mappedPath = `workshops.${activeWorkshopIndex}.workshopDetails.${name.replace(
                                "workshopDetails.",
                                ""
                              )}`;
                              return formValuesTarget.get(mappedPath);
                            }
                            return formValuesTarget.get(name);
                          };
                        }
                        return (formValuesTarget as any)[formValuesProp];
                      },
                    });
                  }

                  // Intercept _subjects to map field paths for onChange events
                  if (prop === "_subjects") {
                    const subjects = target._subjects;
                    return new Proxy(subjects, {
                      get(subjectsTarget, subjectsProp) {
                        if (subjectsProp === "values") {
                          const valuesSubject = (subjectsTarget as any).values;
                          return new Proxy(valuesSubject, {
                            get(valuesSubjectTarget, valuesSubjectProp) {
                              if (valuesSubjectProp === "next") {
                                return (value: any) => {
                                  // Map workshopDetails.* paths in the value object
                                  if (value && typeof value === "object") {
                                    const mappedValue = { ...value };
                                    Object.keys(mappedValue).forEach((key) => {
                                      if (key.startsWith("workshopDetails.")) {
                                        const mappedPath = `workshops.${activeWorkshopIndex}.workshopDetails.${key.replace(
                                          "workshopDetails.",
                                          ""
                                        )}`;
                                        mappedValue[mappedPath] =
                                          mappedValue[key];
                                        delete mappedValue[key];
                                      }
                                    });
                                    return valuesSubjectTarget.next(
                                      mappedValue
                                    );
                                  }
                                  return valuesSubjectTarget.next(value);
                                };
                              }
                              return (valuesSubjectTarget as any)[
                                valuesSubjectProp
                              ];
                            },
                          });
                        }
                        return (subjectsTarget as any)[subjectsProp];
                      },
                    });
                  }

                  return originalValue;
                },
              }) as any;

              // Create a custom setValue that ensures watch updates
              const workshopDetailsSetValue = (path: string, value: any) => {
                // Map workshopDetails.* to workshops.{index}.workshopDetails.*
                if (path.startsWith("workshopDetails.")) {
                  const fieldName = path.replace("workshopDetails.", "");
                  const currentWorkshops = getValues("workshops") || [];
                  const updatedWorkshops = currentWorkshops.map((w) =>
                    w.id === activeWorkshopId
                      ? {
                          ...w,
                          workshopDetails: {
                            ...w.workshopDetails,
                            [fieldName]: value,
                          },
                        }
                      : w
                  );
                  // Use setValue with shouldValidate and shouldDirty to ensure watch updates
                  setValue("workshops", updatedWorkshops, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                } else {
                  setValue(path as any, value, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }
              };

              return (
                <WorkshopDetailsForm
                  control={workshopDetailsControl}
                  setValue={workshopDetailsSetValue}
                  workshopDetails={
                    activeWorkshop.workshopDetails as WorkshopDetails
                  }
                  register={register as any}
                  showEventAssociation={false}
                  associatedEventId={eventId || null}
                />
              );
            })()}
          </div>
        )}

        {activeTab === "Roles" && (
          <div className="space-y-4">
            <EmbeddedWorkshopRolesForm
              control={control}
              setValue={(path, value) => {
                // Handle nested paths directly - the form now uses workshops.{index}.roles.* paths
                if (path.startsWith(`workshops.${activeWorkshopIndex}.roles`)) {
                  // Normalize role titles when setting
                  if (path.endsWith(".title")) {
                    const normalizedValue = toNeo4jRoleFormat(
                      value as string
                    ) as "ORGANIZER" | "TEACHER";
                    setValue(path as any, normalizedValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  } else if (path.endsWith(".user")) {
                    // Ensure user field has proper structure
                    // Accept users with either id or username (server will look up id from username if needed)
                    const userValue = value as UserSearchItem | null;
                    const normalizedUser =
                      userValue && userValue.username
                        ? {
                            id: userValue.id, // May be undefined, server will look it up
                            displayName: userValue.displayName || "",
                            username: userValue.username || "",
                          }
                        : null;
                    setValue(path as any, normalizedUser, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  } else if (
                    path === `workshops.${activeWorkshopIndex}.roles`
                  ) {
                    // Setting entire roles array - normalize all roles
                    // Accept users with either id or username (server will look up id from username if needed)
                    const normalizedRoles = (value as WorkshopRole[]).map(
                      (role) => ({
                        id:
                          role.id || Math.random().toString(36).substring(2, 9),
                        title: toNeo4jRoleFormat(role.title) as
                          | "ORGANIZER"
                          | "TEACHER",
                        user:
                          role.user && role.user.username
                            ? {
                                id: role.user.id, // May be undefined, server will look it up
                                displayName: role.user.displayName || "",
                                username: role.user.username || "",
                              }
                            : null,
                      })
                    );
                    setValue(path as any, normalizedRoles, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  } else {
                    setValue(path as any, value, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }
                } else {
                  // Fallback for other paths
                  setValue(path as any, value, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }
              }}
              roles={roles}
              workshopIndex={activeWorkshopIndex}
            />
          </div>
        )}

        {activeTab === "Videos" && (
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
              {videos.map((video, videoIndex) => {
                // Create a wrapper control that maps field paths correctly
                // The control needs to map videos.* paths to workshops.{index}.videos.*
                const videoControl = new Proxy(control, {
                  get(target, prop) {
                    const originalValue = (target as any)[prop];

                    // Intercept _getWatch to map field paths for reading values
                    if (prop === "_getWatch") {
                      return (name: string) => {
                        if (name && name.startsWith("videos.")) {
                          const mappedPath = `workshops.${activeWorkshopIndex}.videos.${name.replace(
                            "videos.",
                            ""
                          )}`;
                          return target._getWatch(mappedPath);
                        }
                        return target._getWatch(name);
                      };
                    }

                    // Intercept _formValues to map field paths
                    if (prop === "_formValues") {
                      const formValues = target._formValues;
                      return new Proxy(formValues, {
                        get(formValuesTarget, formValuesProp) {
                          if (formValuesProp === "get") {
                            return (name: string) => {
                              if (name && name.startsWith("videos.")) {
                                const mappedPath = `workshops.${activeWorkshopIndex}.videos.${name.replace(
                                  "videos.",
                                  ""
                                )}`;
                                return formValuesTarget.get(mappedPath);
                              }
                              return formValuesTarget.get(name);
                            };
                          }
                          return (formValuesTarget as any)[formValuesProp];
                        },
                      });
                    }

                    // Intercept _subjects to map field paths for onChange events
                    if (prop === "_subjects") {
                      const subjects = target._subjects;
                      return new Proxy(subjects, {
                        get(subjectsTarget, subjectsProp) {
                          if (subjectsProp === "values") {
                            const valuesSubject = (subjectsTarget as any)
                              .values;
                            return new Proxy(valuesSubject, {
                              get(valuesSubjectTarget, valuesSubjectProp) {
                                if (valuesSubjectProp === "next") {
                                  return (value: any) => {
                                    // Map videos.* paths in the value object
                                    if (value && typeof value === "object") {
                                      const mappedValue = { ...value };
                                      Object.keys(mappedValue).forEach(
                                        (key) => {
                                          if (key.startsWith("videos.")) {
                                            const mappedPath = `workshops.${activeWorkshopIndex}.videos.${key.replace(
                                              "videos.",
                                              ""
                                            )}`;
                                            mappedValue[mappedPath] =
                                              mappedValue[key];
                                            delete mappedValue[key];
                                          }
                                        }
                                      );
                                      return valuesSubjectTarget.next(
                                        mappedValue
                                      );
                                    }
                                    return valuesSubjectTarget.next(value);
                                  };
                                }
                                return (valuesSubjectTarget as any)[
                                  valuesSubjectProp
                                ];
                              },
                            });
                          }
                          return (subjectsTarget as any)[subjectsProp];
                        },
                      });
                    }

                    return originalValue;
                  },
                }) as any;

                const videoSetValue = (path: string, value: any) => {
                  // Handle videos array updates (updateTaggedDancers, updateVideoStyles)
                  if (path === "videos") {
                    const currentWorkshops = getValues("workshops") || [];
                    const updatedWorkshops = currentWorkshops.map((w) =>
                      w.id === activeWorkshopId ? { ...w, videos: value } : w
                    );
                    setValue("workshops", updatedWorkshops);
                  } else if (path.startsWith("videos.")) {
                    // Map videos.* to workshops.{index}.videos.*
                    const fieldPath = path.replace("videos.", "");
                    const [idx, ...rest] = fieldPath.split(".");
                    const currentWorkshops = getValues("workshops") || [];
                    const updatedWorkshops = currentWorkshops.map((w) =>
                      w.id === activeWorkshopId
                        ? {
                            ...w,
                            videos: (w.videos || []).map((v, i) =>
                              i === videoIndex
                                ? rest.length > 0
                                  ? { ...v, [rest.join(".")]: value }
                                  : value
                                : v
                            ),
                          }
                        : w
                    );
                    setValue("workshops", updatedWorkshops);
                  } else {
                    setValue(path as any, value);
                  }
                };
                const videoGetValues = (path?: string) => {
                  const currentWorkshops = getValues("workshops") || [];
                  const workshop = currentWorkshops.find(
                    (w) => w.id === activeWorkshopId
                  );
                  if (path === "videos") {
                    return workshop?.videos || [];
                  }
                  // For other paths, return the structure expected by react-hook-form
                  return {
                    videos: workshop?.videos || [],
                  };
                };
                return (
                  <WorkshopVideoForm
                    key={video.id}
                    control={videoControl}
                    setValue={videoSetValue as any}
                    getValues={videoGetValues as any}
                    video={video}
                    videoIndex={videoIndex}
                    onRemove={() => removeVideo(video.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "Photo Gallery" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Photo Gallery</h3>
              <Button
                type="button"
                onClick={addGalleryImage}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((image, imageIndex) => (
                <FormField
                  key={image.id}
                  control={control}
                  name={`workshops.${activeWorkshopIndex}.gallery.${imageIndex}`}
                  render={() => (
                    <FormItem>
                      <FormLabel>Image {imageIndex + 1}</FormLabel>
                      <FormControl>
                        <UploadFile
                          register={register}
                          name={`workshops.${activeWorkshopIndex}.gallery.${imageIndex}`}
                          onFileChange={(file) => {
                            const currentWorkshops =
                              getValues("workshops") || [];
                            const updatedWorkshops = currentWorkshops.map((w) =>
                              w.id === activeWorkshopId
                                ? {
                                    ...w,
                                    gallery: (w.gallery || []).map((g, idx) =>
                                      idx === imageIndex ? (file as Picture) : g
                                    ),
                                  }
                                : w
                            );
                            setValue("workshops", updatedWorkshops);
                          }}
                          className="bg-[#E8E7E7]"
                          maxFiles={1}
                          files={image || null}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
