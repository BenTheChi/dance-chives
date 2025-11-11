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
import type { Control, UseFormSetValue } from "react-hook-form";
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
  eventId,
}: VideoFormProps) {
  const bracketIndex = sections[sectionIndex].brackets.findIndex(
    (b) => b.id === activeBracketId
  );
  const [videoWinners, setVideoWinners] = useState<UserSearchItem[]>([]);

  // Load existing winners from taggedUsers (users with WINNER role)
  // Extract winners as UserSearchItem objects, deduplicating by ID
  useEffect(() => {
    if (video.taggedUsers && Array.isArray(video.taggedUsers)) {
      // Create a Map to deduplicate winners by username
      const winnersMap = new Map<string, UserSearchItem>();
      video.taggedUsers.forEach((user) => {
        if (user && user.username) {
          const role = user.role;
          // Check for both Neo4j format (WINNER) and display format (Winner)
          if (
            role === "WINNER" ||
            role === "Winner" ||
            role?.toUpperCase() === "WINNER"
          ) {
            // Only add if not already in map (deduplicate)
            if (!winnersMap.has(user.username)) {
              winnersMap.set(user.username, {
                id: user.id, // Preserve id if present (from server data)
                displayName: user.displayName,
                username: user.username,
              });
            }
          }
        }
      });
      setVideoWinners(Array.from(winnersMap.values()));
    } else {
      setVideoWinners([]);
    }
  }, [video.taggedUsers, video.id]);

  const handleMarkAsVideoWinner = (user: UserSearchItem) => {
    // Prevent duplicate submissions
    if (videoWinners.find((w) => w.username === user.username)) {
      return;
    }

    // Get current video from sections to ensure we have the latest state
    const currentSection = sections.find((s) => s.id === activeSectionId);
    let currentVideo: Video | undefined;

    if (context === "section" && currentSection) {
      currentVideo = currentSection.videos.find((v) => v.id === video.id);
    } else if (context === "bracket" && currentSection) {
      const currentBracket = currentSection.brackets.find(
        (b) => b.id === activeBracketId
      );
      currentVideo = currentBracket?.videos.find((v) => v.id === video.id);
    }

    const currentTaggedUsers =
      currentVideo?.taggedUsers || video.taggedUsers || [];

    // Update taggedUsers: add WINNER role, and ensure Dancer role is present
    // Create separate entries for each role (matching Neo4j UNWIND structure)
    const existingUserEntries = currentTaggedUsers.filter(
      (tu) => tu.username === user.username
    );
    const existingRoles = new Set(
      existingUserEntries.map((tu) => tu.role).filter((r): r is string => !!r)
    );

    // Remove all existing entries for this user
    const otherUsers = currentTaggedUsers.filter(
      (tu) => tu.username !== user.username
    );

    // Create new entries: one for DANCER, one for WINNER
    const newEntries: UserSearchItem[] = [];

    // Always include DANCER role
    if (!existingRoles.has(VIDEO_ROLE_DANCER) && !existingRoles.has("DANCER")) {
      newEntries.push({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: VIDEO_ROLE_DANCER,
      });
    } else {
      // Keep existing DANCER entry if it exists
      const dancerEntry = existingUserEntries.find(
        (tu) => tu.role === VIDEO_ROLE_DANCER || tu.role === "DANCER"
      );
      if (dancerEntry) {
        newEntries.push(dancerEntry);
      }
    }

    // Always include WINNER role
    if (!existingRoles.has(VIDEO_ROLE_WINNER) && !existingRoles.has("WINNER")) {
      newEntries.push({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: VIDEO_ROLE_WINNER,
      });
    } else {
      // Keep existing WINNER entry if it exists
      const winnerEntry = existingUserEntries.find(
        (tu) => tu.role === VIDEO_ROLE_WINNER || tu.role === "WINNER"
      );
      if (winnerEntry) {
        newEntries.push(winnerEntry);
      }
    }

    const updatedTaggedUsers = [...otherUsers, ...newEntries];

    // Update form state
    updateTaggedUsers(updatedTaggedUsers);

    // Update local winners state for display
    setVideoWinners((prev) => {
      if (prev.find((w) => w.username === user.username)) {
        return prev;
      }
      return [...prev, user];
    });
  };

  const handleRemoveVideoWinner = (username: string) => {
    const winnerToRemove = videoWinners.find((w) => w.username === username);
    if (!winnerToRemove) {
      return;
    }

    // Get current video from sections
    const currentSection = sections.find((s) => s.id === activeSectionId);
    let currentVideo: Video | undefined;

    if (context === "section" && currentSection) {
      currentVideo = currentSection.videos.find((v) => v.id === video.id);
    } else if (context === "bracket" && currentSection) {
      const currentBracket = currentSection.brackets.find(
        (b) => b.id === activeBracketId
      );
      currentVideo = currentBracket?.videos.find((v) => v.id === video.id);
    }

    const currentTaggedUsers =
      currentVideo?.taggedUsers || video.taggedUsers || [];

    // Update taggedUsers: remove WINNER role entry, but keep Dancer role entry if present
    const updatedTaggedUsers = currentTaggedUsers.filter((taggedUser) => {
      // Remove only the WINNER entry for this user, keep DANCER entry
      if (taggedUser.username === username) {
        const role = taggedUser.role;
        const isWinner =
          role === VIDEO_ROLE_WINNER ||
          role === "WINNER" ||
          role?.toUpperCase() === "WINNER";
        // Filter out WINNER entry, keep everything else (including DANCER entry)
        return !isWinner;
      }
      return true; // Keep all entries for other users
    });

    // Update form state
    updateTaggedUsers(updatedTaggedUsers);

    // Update local winners state for display
    setVideoWinners((prev) => prev.filter((w) => w.username !== username));
  };

  const updateTaggedUsers = (users: UserSearchItem[]) => {
    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id ? { ...v, taggedUsers: users } : v
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
                    v.id === video.id ? { ...v, taggedUsers: users } : v
                  ),
                }
              : bracket
          ),
        };
      }
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));
  };

  const updateVideoStyles = (styles: string[]) => {
    const updatedSections = sections.map((section) => {
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
          placeholder="Search users..."
          getDisplayValue={(item) => `${item.displayName} (${item.username})`}
          getItemId={(item) => item.username}
          onChange={updateTaggedUsers}
          value={video.taggedUsers ?? []}
          name="Tagged Users"
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
                // When users are selected, mark them as winners
                // Only process new users that aren't already winners
                const newUsers = users.filter(
                  (user) =>
                    !videoWinners.find((w) => w.username === user.username)
                );

                // Process each new user
                for (const user of newUsers) {
                  handleMarkAsVideoWinner(user);
                }

                // Remove users that are no longer selected
                const removedUsers = videoWinners.filter(
                  (winner) => !users.find((u) => u.username === winner.username)
                );
                for (const removedUser of removedUsers) {
                  handleRemoveVideoWinner(removedUser.username);
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
