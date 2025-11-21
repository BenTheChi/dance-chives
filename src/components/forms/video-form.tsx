"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X, Trophy } from "lucide-react";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { FormValues } from "./event-form";
import { Section } from "@/types/event";
import { Video } from "@/types/video";
import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
import { UserSearchItem } from "@/types/user";
import { VideoEmbed } from "../VideoEmbed";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER } from "@/lib/utils/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VideoFormProps {
  video: Video;
  videoIndex: number;
  sectionIndex: number;
  sections: Section[];
  activeSectionId: string;
  activeBracketId?: string;
  context: "section" | "bracket";
  onRemove: () => void;
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  getValues: UseFormGetValues<FormValues>;
  eventId?: string; // Event ID for winner tagging (only in edit mode)
}

// Helper function to normalize sections for form (ensures description is always string)
function normalizeSectionsForForm(sections: Section[]): FormValues["sections"] {
  return sections.map((section) => ({
    ...section,
    description: section.description ?? "",
  }));
}

async function searchUsers(query: string): Promise<UserSearchItem[]> {
  return fetch(`${process.env.NEXT_PUBLIC_ORIGIN}/api/users?keyword=${query}`)
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to fetch users", response.statusText);
        return [];
      }
      return response.json();
    })
    .then((data) => {
      return data.data;
    })
    .catch((error) => {
      console.error(error);
      return [];
    });
}

export function VideoForm({
  video,
  videoIndex,
  sectionIndex,
  sections,
  activeSectionId,
  activeBracketId,
  context,
  onRemove,
  control,
  setValue,
  getValues,
  eventId,
}: VideoFormProps) {
  const bracketIndex = sections[sectionIndex].brackets.findIndex(
    (b) => b.id === activeBracketId
  );
  const [videoWinners, setVideoWinners] = useState<UserSearchItem[]>([]);
  const [videoDancers, setVideoDancers] = useState<UserSearchItem[]>([]);
  const [videoChoreographers, setVideoChoreographers] = useState<
    UserSearchItem[]
  >([]);
  const [videoTeachers, setVideoTeachers] = useState<UserSearchItem[]>([]);

  // Load existing tagged users from separate arrays
  // Use type assertion since Video is a union type and properties are on specific types
  const videoAny = video as any;
  useEffect(() => {
    setVideoWinners(videoAny.taggedWinners || []);
    setVideoDancers(videoAny.taggedDancers || []);
    setVideoChoreographers(videoAny.taggedChoreographers || []);
    setVideoTeachers(videoAny.taggedTeachers || []);
  }, [
    videoAny.taggedWinners,
    videoAny.taggedDancers,
    videoAny.taggedChoreographers,
    videoAny.taggedTeachers,
    video.id,
  ]);

  // Get current video type
  const videoType = video.type || "battle";

  const updateTaggedDancers = (dancers: UserSearchItem[]) => {
    console.log("🟢 [updateTaggedDancers] Updating tagged dancers:", dancers);
    const currentSections = getValues("sections") || [];

    // Find users that were removed from dancers list
    const currentDancerUsernames = new Set(videoDancers.map((d) => d.username));
    const newDancerUsernames = new Set(dancers.map((d) => d.username));
    const removedUsernames = Array.from(currentDancerUsernames).filter(
      (username) => !newDancerUsernames.has(username)
    );

    // If any removed users are also winners, remove them from winners list
    let winnersToUpdate = videoWinners;
    if (removedUsernames.length > 0 && videoWinners.length > 0) {
      const winnersToKeep = videoWinners.filter(
        (winner) => !removedUsernames.includes(winner.username)
      );
      if (winnersToKeep.length !== videoWinners.length) {
        // Some winners were removed, update winners list
        winnersToUpdate = winnersToKeep;
        setVideoWinners(winnersToKeep);
      }
    }

    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id
              ? { ...v, taggedDancers: dancers, taggedWinners: winnersToUpdate }
              : v
          ),
        };
      } else {
        return {
          ...section,
          brackets: section.brackets.map((bracket) =>
            bracket.id === activeBracketId
              ? {
                  ...bracket,
                  videos: bracket.videos.map((v) =>
                    v.id === video.id
                      ? {
                          ...v,
                          taggedDancers: dancers,
                          taggedWinners: winnersToUpdate,
                        }
                      : v
                  ),
                }
              : bracket
          ),
        };
      }
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));
    setVideoDancers(dancers);
  };

  const updateTaggedWinners = (winners: UserSearchItem[]) => {
    console.log("🟢 [updateTaggedWinners] Updating tagged winners:", winners);
    const currentSections = getValues("sections") || [];

    // Find users that were added to winners list
    const currentWinnerUsernames = new Set(videoWinners.map((w) => w.username));
    const newWinnerUsernames = new Set(winners.map((w) => w.username));
    const addedUsernames = Array.from(newWinnerUsernames).filter(
      (username) => !currentWinnerUsernames.has(username)
    );

    // If any new winners are not in dancers list, add them
    let dancersToUpdate = videoDancers;
    if (addedUsernames.length > 0) {
      const currentDancerUsernames = new Set(
        videoDancers.map((d) => d.username)
      );
      const newDancers = [...videoDancers];

      winners.forEach((winner) => {
        if (
          addedUsernames.includes(winner.username) &&
          !currentDancerUsernames.has(winner.username)
        ) {
          newDancers.push(winner);
        }
      });

      if (newDancers.length !== videoDancers.length) {
        dancersToUpdate = newDancers;
        setVideoDancers(newDancers);
      }
    }

    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id
              ? { ...v, taggedWinners: winners, taggedDancers: dancersToUpdate }
              : v
          ),
        };
      } else {
        return {
          ...section,
          brackets: section.brackets.map((bracket) =>
            bracket.id === activeBracketId
              ? {
                  ...bracket,
                  videos: bracket.videos.map((v) =>
                    v.id === video.id
                      ? {
                          ...v,
                          taggedWinners: winners,
                          taggedDancers: dancersToUpdate,
                        }
                      : v
                  ),
                }
              : bracket
          ),
        };
      }
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));
    setVideoWinners(winners);
  };

  const handleMarkAsVideoWinner = (user: UserSearchItem) => {
    // Prevent duplicate submissions
    if (videoWinners.find((w) => w.username === user.username)) {
      return;
    }

    // Add to winners list - updateTaggedWinners will automatically add to dancers if needed
    const newWinners = [...videoWinners, user];
    updateTaggedWinners(newWinners);
  };

  const handleRemoveVideoWinner = (username: string) => {
    // Remove from winners but keep in dancers
    const newWinners = videoWinners.filter((w) => w.username !== username);
    updateTaggedWinners(newWinners);
  };

  const updateVideoStyles = (styles: string[]) => {
    // Read current form state to ensure we have the latest data
    const currentSections = getValues("sections") || [];
    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id ? { ...v, styles } : v
          ),
        };
      } else {
        return {
          ...section,
          brackets: section.brackets.map((bracket) =>
            bracket.id === activeBracketId
              ? {
                  ...bracket,
                  videos: bracket.videos.map((v) =>
                    v.id === video.id ? { ...v, styles } : v
                  ),
                }
              : bracket
          ),
        };
      }
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));
  };

  const updateVideoType = (
    type: "battle" | "freestyle" | "choreography" | "class"
  ) => {
    const currentSections = getValues("sections") || [];
    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id ? { ...v, type } : v
          ),
        };
      } else {
        return {
          ...section,
          brackets: section.brackets.map((bracket) =>
            bracket.id === activeBracketId
              ? {
                  ...bracket,
                  videos: bracket.videos.map((v) =>
                    v.id === video.id ? { ...v, type } : v
                  ),
                }
              : bracket
          ),
        };
      }
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));
  };

  const updateTaggedChoreographers = (choreographers: UserSearchItem[]) => {
    const currentSections = getValues("sections") || [];
    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id
              ? { ...v, taggedChoreographers: choreographers }
              : v
          ),
        };
      } else {
        return {
          ...section,
          brackets: section.brackets.map((bracket) =>
            bracket.id === activeBracketId
              ? {
                  ...bracket,
                  videos: bracket.videos.map((v) =>
                    v.id === video.id
                      ? { ...v, taggedChoreographers: choreographers }
                      : v
                  ),
                }
              : bracket
          ),
        };
      }
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));
    setVideoChoreographers(choreographers);
  };

  const updateTaggedTeachers = (teachers: UserSearchItem[]) => {
    const currentSections = getValues("sections") || [];
    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id ? { ...v, taggedTeachers: teachers } : v
          ),
        };
      } else {
        return {
          ...section,
          brackets: section.brackets.map((bracket) =>
            bracket.id === activeBracketId
              ? {
                  ...bracket,
                  videos: bracket.videos.map((v) =>
                    v.id === video.id ? { ...v, taggedTeachers: teachers } : v
                  ),
                }
              : bracket
          ),
        };
      }
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));
    setVideoTeachers(teachers);
  };

  // Check if styles should be disabled (when section has applyStylesToVideos enabled)
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const isStylesDisabled = activeSection?.applyStylesToVideos || false;

  return (
    <Card className="group">
      <CardHeader className="relative">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          <X className="h-3 w-3" />
        </Button>
        <FormField
          control={control}
          name={
            context === "bracket"
              ? `sections.${sectionIndex}.brackets.${bracketIndex}.videos.${videoIndex}.title`
              : `sections.${sectionIndex}.videos.${videoIndex}.title`
          }
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <VideoEmbed title={video.title} src={video.src} />
        </div>

        <FormField
          control={control}
          name={
            context === "bracket"
              ? `sections.${sectionIndex}.brackets.${bracketIndex}.videos.${videoIndex}.src`
              : `sections.${sectionIndex}.videos.${videoIndex}.src`
          }
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={
            context === "bracket"
              ? `sections.${sectionIndex}.brackets.${bracketIndex}.videos.${videoIndex}.type`
              : `sections.${sectionIndex}.videos.${videoIndex}.type`
          }
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Type</FormLabel>
              <FormControl>
                <Select
                  value={field.value || "battle"}
                  onValueChange={(value) => {
                    const type = value as
                      | "battle"
                      | "freestyle"
                      | "choreography"
                      | "class";
                    field.onChange(type);
                    updateVideoType(type);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select video type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="battle">Battle</SelectItem>
                    <SelectItem value="freestyle">Freestyle</SelectItem>
                    <SelectItem value="choreography">Choreography</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DebouncedSearchMultiSelect<UserSearchItem>
          onSearch={searchUsers}
          placeholder="Search dancers..."
          getDisplayValue={(item) => `${item.displayName} (${item.username})`}
          getItemId={(item) => item.username}
          onChange={updateTaggedDancers}
          value={videoAny.taggedDancers ?? []}
          name="Tagged Dancers"
        />

        {/* Tagged Winners - only for battle videos */}
        {videoType === "battle" && (
          <FormField
            control={control}
            name={
              context === "bracket"
                ? `sections.${sectionIndex}.brackets.${bracketIndex}.videos.${videoIndex}.taggedWinners`
                : `sections.${sectionIndex}.videos.${videoIndex}.taggedWinners`
            }
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DebouncedSearchMultiSelect<UserSearchItem>
                    onSearch={searchUsers}
                    placeholder="Search winners..."
                    getDisplayValue={(item) =>
                      `${item.displayName} (${item.username})`
                    }
                    getItemId={(item) => item.username}
                    onChange={(users) => {
                      field.onChange(users);
                      // updateTaggedWinners will automatically add new winners to dancers list
                      updateTaggedWinners(users);
                    }}
                    value={field.value || []}
                    name="Tagged Winners"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Tagged Choreographers - only for choreography videos */}
        {videoType === "choreography" && (
          <DebouncedSearchMultiSelect<UserSearchItem>
            onSearch={searchUsers}
            placeholder="Search choreographers..."
            getDisplayValue={(item) => `${item.displayName} (${item.username})`}
            getItemId={(item) => item.username}
            onChange={updateTaggedChoreographers}
            value={videoAny.taggedChoreographers ?? []}
            name="Tagged Choreographers"
          />
        )}

        {/* Tagged Teachers - only for class videos */}
        {videoType === "class" && (
          <DebouncedSearchMultiSelect<UserSearchItem>
            onSearch={searchUsers}
            placeholder="Search teachers..."
            getDisplayValue={(item) => `${item.displayName} (${item.username})`}
            getItemId={(item) => item.username}
            onChange={updateTaggedTeachers}
            value={videoAny.taggedTeachers ?? []}
            name="Tagged Teachers"
          />
        )}

        <FormField
          control={control}
          name={
            context === "bracket"
              ? `sections.${sectionIndex}.brackets.${bracketIndex}.videos.${videoIndex}.styles`
              : `sections.${sectionIndex}.videos.${videoIndex}.styles`
          }
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dance Styles</FormLabel>
              {isStylesDisabled && (
                <p className="text-sm text-muted-foreground mb-2">
                  Styles inherited from section
                </p>
              )}
              <FormControl>
                <StyleMultiSelect
                  value={field.value || []}
                  onChange={(styles) => {
                    field.onChange(styles);
                    updateVideoStyles(styles);
                  }}
                  disabled={isStylesDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
