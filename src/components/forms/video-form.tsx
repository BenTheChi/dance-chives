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
import {
  markUserAsVideoWinner,
  removeVideoWinnerTag,
} from "@/lib/server_actions/request_actions";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const bracketIndex = sections[sectionIndex].brackets.findIndex(
    (b) => b.id === activeBracketId
  );
  const [videoWinners, setVideoWinners] = useState<Set<string>>(new Set());
  const [isProcessingWinner, setIsProcessingWinner] = useState<string | null>(
    null
  );

  // Load existing winners from taggedUsers (users with WINNER role)
  useEffect(() => {
    if (video.taggedUsers) {
      const winners = video.taggedUsers
        .filter((user) => {
          const role = user.role;
          return role === "WINNER" || role === "Winner";
        })
        .map((user) => user.id);
      setVideoWinners(new Set(winners));
    }
  }, [video.taggedUsers]);

  const handleMarkAsWinner = async (userId: string) => {
    if (!eventId) {
      toast.error("Event ID is required to mark winners");
      return;
    }

    setIsProcessingWinner(userId);
    try {
      await markUserAsVideoWinner(eventId, video.id, userId);
      setVideoWinners((prev) => new Set([...prev, userId]));
      toast.success("User marked as winner");
    } catch (error) {
      console.error("Error marking user as winner:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to mark user as winner"
      );
    } finally {
      setIsProcessingWinner(null);
    }
  };

  const handleRemoveWinner = async (userId: string) => {
    if (!eventId) {
      toast.error("Event ID is required to remove winner tags");
      return;
    }

    setIsProcessingWinner(userId);
    try {
      await removeVideoWinnerTag(eventId, video.id, userId);
      setVideoWinners((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      toast.success("Winner tag removed");
    } catch (error) {
      console.error("Error removing winner tag:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove winner tag"
      );
    } finally {
      setIsProcessingWinner(null);
    }
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
          getItemId={(item) => item.id}
          onChange={updateTaggedUsers}
          value={video.taggedUsers ?? []}
          name="Tagged Users"
        />

        {/* Winners Section - Only show in edit mode */}
        {eventId && video.taggedUsers && video.taggedUsers.length > 0 && (
          <div className="space-y-2">
            <FormLabel>Winners</FormLabel>
            <div className="flex flex-wrap gap-2">
              {video.taggedUsers.map((user) => {
                const isWinner = videoWinners.has(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 border rounded-md px-2 py-1"
                  >
                    <span className="text-sm">
                      {user.displayName} ({user.username})
                    </span>
                    {isWinner ? (
                      <Badge
                        variant="default"
                        className="bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                      >
                        <Trophy className="w-3 h-3 mr-1" />
                        Winner
                      </Badge>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        isWinner
                          ? handleRemoveWinner(user.id)
                          : handleMarkAsWinner(user.id)
                      }
                      disabled={isProcessingWinner === user.id}
                      className="h-6 px-2"
                    >
                      {isProcessingWinner === user.id ? (
                        "Processing..."
                      ) : isWinner ? (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Remove Winner
                        </>
                      ) : (
                        <>
                          <Trophy className="w-3 h-3 mr-1" />
                          Mark as Winner
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
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
