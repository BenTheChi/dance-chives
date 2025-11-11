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
import { Section, Video } from "@/types/event";
import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
import { UserSearchItem } from "@/types/user";
import { VideoEmbed } from "../VideoEmbed";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { VIDEO_ROLE_DANCER, VIDEO_ROLE_WINNER } from "@/lib/utils/roles";

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

  // Load existing winners and dancers from separate arrays
  useEffect(() => {
    setVideoWinners(video.taggedWinners || []);
    setVideoDancers(video.taggedDancers || []);
  }, [video.taggedWinners, video.taggedDancers, video.id]);

  const updateTaggedDancers = (dancers: UserSearchItem[]) => {
    console.log("🟢 [updateTaggedDancers] Updating tagged dancers:", dancers);
    const currentSections = getValues("sections") || [];

    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id ? { ...v, taggedDancers: dancers } : v
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
                    v.id === video.id ? { ...v, taggedDancers: dancers } : v
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

    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id ? { ...v, taggedWinners: winners } : v
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
                    v.id === video.id ? { ...v, taggedWinners: winners } : v
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

    // Add to winners list
    const newWinners = [...videoWinners, user];
    updateTaggedWinners(newWinners);

    // Ensure user is also in dancers list if not already
    if (!videoDancers.find((d) => d.username === user.username)) {
      const newDancers = [...videoDancers, user];
      updateTaggedDancers(newDancers);
    }
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

        <DebouncedSearchMultiSelect<UserSearchItem>
          onSearch={searchUsers}
          placeholder="Search dancers..."
          getDisplayValue={(item) => `${item.displayName} (${item.username})`}
          getItemId={(item) => item.username}
          onChange={updateTaggedDancers}
          value={video.taggedDancers ?? []}
          name="Tagged Dancers"
        />

        {/* Video Winners Section - Only show in edit mode */}
        {eventId && (
          <div className="space-y-2">
            <DebouncedSearchMultiSelect<UserSearchItem>
              onSearch={searchUsers}
              placeholder="Search users to mark as video winners..."
              getDisplayValue={(item) =>
                `${item.displayName} (${item.username})`
              }
              getItemId={(item) => item.username}
              onChange={(users) => {
                // Update winners list directly
                updateTaggedWinners(users);

                // Ensure all winners are also in dancers list
                const currentDancers = videoDancers || [];
                const dancersSet = new Set(
                  currentDancers.map((d) => d.username)
                );
                const newDancers = [...currentDancers];

                users.forEach((winner) => {
                  if (!dancersSet.has(winner.username)) {
                    newDancers.push(winner);
                  }
                });

                if (newDancers.length !== currentDancers.length) {
                  updateTaggedDancers(newDancers);
                }
              }}
              value={videoWinners}
              name="Video Winners"
            />
            {videoWinners.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {videoWinners
                  .filter((winner) => winner && winner.username) // Filter out any invalid entries
                  .map((winner) => {
                    return (
                      <Badge
                        key={winner.username}
                        variant="default"
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        <Trophy className="w-3 h-3 mr-1" />
                        {winner.displayName}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveVideoWinner(winner.username)
                          }
                          className="h-4 w-4 p-0 ml-2 hover:bg-yellow-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    );
                  })}
              </div>
            )}
          </div>
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
