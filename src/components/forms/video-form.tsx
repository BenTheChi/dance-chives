"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
  Path,
} from "react-hook-form";
import { FormValues } from "./event-form";
import { Section } from "@/types/event";
import { Video } from "@/types/video";
import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
import { UserSearchItem } from "@/types/user";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { StyleBadge } from "@/components/ui/style-badge";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import {
  extractYouTubeVideoId,
  normalizeYouTubeThumbnailUrl,
} from "@/lib/utils";

interface VideoFormProps {
  video: Video;
  videoIndex: number;
  sectionIndex?: number;
  sections?: Section[];
  activeSectionId?: string;
  activeBracketId?: string;
  context: "section" | "bracket";
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
    bgColor: section.bgColor || "#ffffff",
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
  control,
  setValue,
  getValues,
}: VideoFormProps) {
  const bracketIndex =
    context === "bracket" && sections && sectionIndex !== undefined
      ? sections[sectionIndex].brackets.findIndex(
          (b) => b.id === activeBracketId
        )
      : -1;
  const [videoWinners, setVideoWinners] = useState<UserSearchItem[]>([]);
  const [videoDancers, setVideoDancers] = useState<UserSearchItem[]>([]);

  // Load existing tagged users from separate arrays
  useEffect(() => {
    setVideoWinners(video.taggedWinners || []);
    setVideoDancers(video.taggedDancers || []);
  }, [video.taggedWinners, video.taggedDancers, video.id]);

  // Get current video type
  const videoType = video.type || "battle";

  const updateTaggedDancers = (dancers: UserSearchItem[]) => {
    console.log("🟢 [updateTaggedDancers] Updating tagged dancers:", dancers);

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

    // Handle section/bracket videos
    const currentSections = getValues("sections") || [];
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

    // Handle section/bracket videos
    const currentSections = getValues("sections") || [];
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

  const updateVideoStyles = (styles: string[]) => {
    // Handle section/bracket videos
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

  const updateTaggedChoreographers = (choreographers: UserSearchItem[]) => {
    // Handle section/bracket videos
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
  };

  const updateTaggedTeachers = (teachers: UserSearchItem[]) => {
    // Handle section/bracket videos
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
  };

  // Check if styles should be disabled (when section has applyStylesToVideos enabled)
  const activeSection = sections?.find((s) => s.id === activeSectionId);
  const isStylesDisabled = activeSection?.applyStylesToVideos || false;

  // Helper function to construct form field path with proper typing
  const getVideoFieldPath = (
    field: "title" | "src" | "type" | "taggedWinners" | "styles"
  ): Path<FormValues> => {
    if (sectionIndex === undefined) {
      throw new Error("sectionIndex is required for form field paths");
    }
    if (context === "bracket") {
      if (bracketIndex === -1) {
        throw new Error("bracketIndex is required for bracket context");
      }
      return `sections.${sectionIndex}.brackets.${bracketIndex}.videos.${videoIndex}.${field}` as Path<FormValues>;
    }
    return `sections.${sectionIndex}.videos.${videoIndex}.${field}` as Path<FormValues>;
  };

  // Type guard functions
  const isUserSearchItemArray = (value: unknown): value is UserSearchItem[] => {
    return (
      Array.isArray(value) &&
      value.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "username" in item &&
          "displayName" in item &&
          typeof item.username === "string" &&
          typeof item.displayName === "string"
      )
    );
  };

  const isStringArray = (value: unknown): value is string[] => {
    return (
      Array.isArray(value) && value.every((item) => typeof item === "string")
    );
  };

  const handleTypeChange = (value: Video["type"]) => {
    const currentSections = getValues("sections") || [];
    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id ? { ...v, type: value } : v
          ),
        };
      }

      return {
        ...section,
        brackets: section.brackets.map((bracket) =>
          bracket.id === activeBracketId
            ? {
                ...bracket,
                videos: bracket.videos.map((v) =>
                  v.id === video.id ? { ...v, type: value } : v
                ),
              }
            : bracket
        ),
      };
    });

    setValue("sections", normalizeSectionsForForm(updatedSections), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const thumbnailFromSrc = () => {
    if (video.thumbnailUrl) return video.thumbnailUrl;
    const youtubeId = extractYouTubeVideoId(video.src);
    if (youtubeId) {
      return normalizeYouTubeThumbnailUrl(
        `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      );
    }
    return null;
  };

  const thumbnailUrl = thumbnailFromSrc();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <FormField
          control={control}
          name={getVideoFieldPath("styles")}
          render={({ field }) => {
            const sectionStyles = activeSection?.styles || [];

            return (
              <FormItem>
                {isStylesDisabled ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sectionStyles.length > 0 ? (
                      sectionStyles.map((style) => (
                        <StyleBadge key={style} style={style} asLink={false} />
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No styles set for this section
                      </span>
                    )}
                  </div>
                ) : (
                  <FormControl>
                    <StyleMultiSelect
                      value={isStringArray(field.value) ? field.value : []}
                      onChange={(styles) => {
                        field.onChange(styles);
                        updateVideoStyles(styles);
                      }}
                      disabled={isStylesDisabled}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={control}
          name={getVideoFieldPath("type")}
          render={({ field }) => (
            <FormItem>
              <Select
                value={(field.value as Video["type"]) || video.type || "battle"}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleTypeChange(value as Video["type"]);
                }}
              >
                <SelectTrigger className="w-[110px] h-9 bg-neutral-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="battle">Battle</SelectItem>
                  <SelectItem value="freestyle">Freestyle</SelectItem>
                  <SelectItem value="choreography">Choreo</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="w-full overflow-hidden rounded-sm border border-border bg-muted/30">
        {thumbnailUrl ? (
          <div className="relative aspect-video">
            <Image
              src={thumbnailUrl}
              alt={video.title || "Video thumbnail"}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
            No thumbnail
          </div>
        )}
      </div>

      <DebouncedSearchMultiSelect<UserSearchItem>
        onSearch={searchUsers}
        placeholder="Search dancers..."
        getDisplayValue={(item) => `${item.displayName} (${item.username})`}
        getItemId={(item) => item.username}
        onChange={updateTaggedDancers}
        value={video.taggedDancers ?? []}
        name="taggedDancers"
        label="Tagged Dancers"
      />

      {/* Tagged Winners - only for battle videos */}
      {videoType === "battle" && (
        <FormField
          control={control}
          name={getVideoFieldPath("taggedWinners")}
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
                  value={isUserSearchItemArray(field.value) ? field.value : []}
                  name="taggedWinners"
                  label="Tagged Winners"
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
          value={video.taggedChoreographers ?? []}
          name="taggedChoreographers"
          label="Tagged Choreographers"
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
          value={video.taggedTeachers ?? []}
          name="taggedTeachers"
          label="Tagged Teachers"
        />
      )}
    </div>
  );
}
