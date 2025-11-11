"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, X, Trophy } from "lucide-react";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { Section, Bracket, Video } from "@/types/event";
import { BracketForm } from "@/components/forms/bracket-form";
import { VideoForm } from "@/components/forms/video-form";
import { FormValues } from "./event-form";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
import { UserSearchItem } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { SECTION_ROLE_WINNER } from "@/lib/utils/roles";

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

interface SectionFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  getValues: UseFormGetValues<FormValues>;
  activeSectionIndex: number;
  activeSection: Section;
  sections: Section[];
  activeSectionId: string;
  eventId?: string; // Event ID for winner tagging (only in edit mode)
}

// Helper function to normalize sections for form (ensures description is always string)
function normalizeSectionsForForm(sections: Section[]): FormValues["sections"] {
  return sections.map((section) => ({
    ...section,
    description: section.description ?? "",
  }));
}

export function SectionForm({
  control,
  setValue,
  getValues,
  activeSectionIndex,
  activeSection,
  sections,
  activeSectionId,
  eventId,
}: SectionFormProps) {
  const [activeBracketId, setActiveBracketId] = useState(
    activeSection.brackets.length > 0 ? activeSection.brackets[0].id : ""
  );
  const [sectionWinners, setSectionWinners] = useState<UserSearchItem[]>([]);

  // Load existing section winners from activeSection.winners
  // Use a Map to deduplicate winners by username
  useEffect(() => {
    if (activeSection?.winners && Array.isArray(activeSection.winners)) {
      // Deduplicate winners by username to prevent duplicates
      const uniqueWinners = Array.from(
        new Map(
          activeSection.winners
            .filter((w) => w && w.username)
            .map((w) => [w.username, w])
        ).values()
      );
      setSectionWinners(uniqueWinners);
    } else {
      setSectionWinners([]);
    }
  }, [activeSectionId, activeSection?.winners]);

  const addBracket = () => {
    if (!activeSection) return;

    const newBracket: Bracket = {
      id: Date.now().toString(),
      title: `New Bracket ${activeSection.brackets.length + 1}`,
      videos: [],
    };

    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? { ...section, brackets: [...section.brackets, newBracket] }
        : section
    );

    // Set active bracket first, then update form
    setValue("sections", normalizeSectionsForForm(updatedSections), {
      shouldValidate: true,
    });
    setActiveBracketId(newBracket.id);
  };

  const removeBracket = (bracketId: string) => {
    if (!activeSection) return;

    const updatedBrackets = activeSection.brackets.filter(
      (bracket) => bracket.id !== bracketId
    );
    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? { ...section, brackets: updatedBrackets }
        : section
    );

    setValue("sections", normalizeSectionsForForm(updatedSections));

    // If we removed the active bracket, switch to the first available bracket
    if (activeBracketId === bracketId && updatedBrackets.length > 0) {
      setActiveBracketId(updatedBrackets[0].id);
    }
  };

  const addVideoToSection = () => {
    if (!activeSection) return;

    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Video ${activeSection.videos.length + 1}`,
      src: "https://example.com/video",
      taggedWinners: [],
      taggedDancers: [],
    };

    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? {
            ...section,
            videos: [...section.videos, newVideo],
            description: section.description ?? "",
          }
        : { ...section, description: section.description ?? "" }
    );

    setValue("sections", normalizeSectionsForForm(updatedSections));
  };

  const removeVideoFromSection = (videoId: string) => {
    if (!activeSection) return;

    const updatedVideos = activeSection.videos.filter(
      (video) => video.id !== videoId
    );
    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? { ...section, videos: updatedVideos }
        : section
    );

    setValue("sections", normalizeSectionsForForm(updatedSections));
  };

  const handleStylesChange = (styles: string[]) => {
    const updatedSections = sections.map((section) =>
      section.id === activeSectionId ? { ...section, styles } : section
    );
    setValue("sections", normalizeSectionsForForm(updatedSections));

    // If applyStylesToVideos is true, propagate styles to all videos
    if (activeSection.applyStylesToVideos) {
      propagateStylesToVideos(styles, updatedSections);
    }
  };

  const handleApplyStylesToVideosChange = (apply: boolean) => {
    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (apply) {
        // When turning ON: propagate section styles to all videos
        const sectionStyles = section.styles || [];
        return {
          ...section,
          applyStylesToVideos: true,
          styles: sectionStyles,
        };
      } else {
        // When turning OFF: remove section styles, clear video styles, enable video-level styles
        // Clear styles from all videos (direct and bracket videos)
        const updatedVideos = section.videos.map((video) => ({
          ...video,
          styles: [], // Empty array is valid for optional array field
        }));

        const updatedBrackets = section.brackets.map((bracket) => ({
          ...bracket,
          videos: bracket.videos.map((video) => ({
            ...video,
            styles: [], // Empty array is valid for optional array field
          })),
        }));

        return {
          ...section,
          applyStylesToVideos: false,
          styles: [], // Empty array is valid for optional array field
          videos: updatedVideos,
          brackets: updatedBrackets,
        };
      }
    });

    setValue("sections", normalizeSectionsForForm(updatedSections), {
      shouldValidate: false,
      shouldDirty: false,
      shouldTouch: false,
    });

    // Propagate styles if turning ON
    if (apply) {
      const sectionStyles = activeSection.styles || [];
      propagateStylesToVideos(sectionStyles, updatedSections);
    }
  };

  const propagateStylesToVideos = (
    styles: string[],
    currentSections: Section[]
  ) => {
    const updatedSections = currentSections.map((section) => {
      if (section.id !== activeSectionId) return section;

      // Update direct videos
      const updatedVideos = section.videos.map((video) => ({
        ...video,
        styles: [...styles],
      }));

      // Update bracket videos
      const updatedBrackets = section.brackets.map((bracket) => ({
        ...bracket,
        videos: bracket.videos.map((video) => ({
          ...video,
          styles: [...styles],
        })),
      }));

      return {
        ...section,
        videos: updatedVideos,
        brackets: updatedBrackets,
      };
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));
  };

  const handleMarkAsSectionWinner = (user: UserSearchItem) => {
    // Prevent duplicate submissions
    if (sectionWinners.find((w) => w.username === user.username)) {
      return;
    }

    // Update section winners in form state
    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) return section;

      const currentWinners = section.winners || [];
      const isAlreadyWinner = currentWinners.some(
        (w) => w.username === user.username
      );

      if (!isAlreadyWinner) {
        return {
          ...section,
          winners: [...currentWinners, user],
        };
      }
      return section;
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));

    // Update local winners state for display
    setSectionWinners((prev) => {
      if (prev.find((w) => w.username === user.username)) {
        return prev;
      }
      return [...prev, user];
    });
  };

  const handleRemoveSectionWinner = (username: string) => {
    const winnerToRemove = sectionWinners.find((w) => w.username === username);
    if (!winnerToRemove) {
      return;
    }

    // Update section winners in form state
    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) return section;

      return {
        ...section,
        winners: (section.winners || []).filter((w) => w.username !== username),
      };
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));

    // Update local winners state for display
    setSectionWinners((prev) => prev.filter((w) => w.username !== username));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          key={`title-${activeSectionId}`}
          control={control}
          name={`sections.${activeSectionIndex}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          key={`description-${activeSectionId}`}
          control={control}
          name={`sections.${activeSectionIndex}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          key={`applyStylesToVideos-${activeSectionId}`}
          control={control}
          name={`sections.${activeSectionIndex}.applyStylesToVideos`}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      handleApplyStylesToVideosChange(checked);
                    }}
                  />
                </FormControl>
                <FormLabel>Apply same style tags to all videos</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {activeSection.applyStylesToVideos && (
          <FormField
            key={`styles-${activeSectionId}`}
            control={control}
            name={`sections.${activeSectionIndex}.styles`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section Dance Styles</FormLabel>
                <FormControl>
                  <StyleMultiSelect
                    value={field.value || []}
                    onChange={(styles) => {
                      field.onChange(styles);
                      handleStylesChange(styles);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Section Winners - Only show in edit mode */}
        {eventId && (
          <div className="space-y-2">
            <DebouncedSearchMultiSelect<UserSearchItem>
              onSearch={searchUsers}
              placeholder="Search users to mark as section winners..."
              getDisplayValue={(item) =>
                `${item.displayName} (${item.username})`
              }
              getItemId={(item) => item.username}
              onChange={(users) => {
                // When users are selected, mark them as winners
                // Only process new users that aren't already winners
                const newUsers = users.filter(
                  (user) =>
                    !sectionWinners.find((w) => w.username === user.username)
                );

                // Process each new user
                for (const user of newUsers) {
                  handleMarkAsSectionWinner(user);
                }

                // Remove users that are no longer selected
                const removedUsers = sectionWinners.filter(
                  (winner) => !users.find((u) => u.username === winner.username)
                );
                for (const removedUser of removedUsers) {
                  handleRemoveSectionWinner(removedUser.username);
                }
              }}
              value={sectionWinners}
              name="Section Winners"
            />
            {sectionWinners.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {sectionWinners
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
                            handleRemoveSectionWinner(winner.username)
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
          key={`hasBrackets-${activeSectionId}`}
          control={control}
          name={`sections.${activeSectionIndex}.hasBrackets`}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Has Brackets</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Videos Section - Always shown */}
        <div className="space-y-4">
          {activeSection.hasBrackets ? (
            // Brackets Section
            <>
              <h3 className="text-lg font-semibold">Brackets</h3>
              <Tabs value={activeBracketId} onValueChange={setActiveBracketId}>
                <div className="flex items-center gap-2">
                  <TabsList>
                    {activeSection.brackets.map((bracket) => (
                      <div key={bracket.id} className="relative group">
                        <TabsTrigger
                          key={`bracket-${bracket.id}`}
                          value={bracket.id}
                          className="pr-6"
                        >
                          {bracket.title}
                        </TabsTrigger>
                        <Button
                          key={`remove-bracket-${bracket.id}`}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBracket(bracket.id)}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>
                    ))}
                  </TabsList>
                  <Button
                    type="button"
                    onClick={addBracket}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bracket
                  </Button>
                </div>

                {activeSection.brackets.map((bracket, bracketIndex) => (
                  <TabsContent
                    key={`tabs-content-${bracket.id}`}
                    value={bracket.id}
                    className="space-y-4"
                  >
                    {activeBracketId === bracket.id && (
                      <BracketForm
                        control={control}
                        setValue={setValue}
                        getValues={getValues}
                        activeSectionIndex={activeSectionIndex}
                        activeBracketIndex={bracketIndex}
                        bracket={bracket}
                        sections={sections}
                        activeSectionId={activeSectionId}
                        activeBracketId={activeBracketId}
                        eventId={eventId}
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </>
          ) : (
            // Direct Videos Section (no brackets)
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Videos</h3>
                <Button
                  type="button"
                  onClick={addVideoToSection}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSection.videos.map((video, videoIndex) => (
                  <VideoForm
                    key={video.id}
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    video={video}
                    videoIndex={videoIndex}
                    sectionIndex={activeSectionIndex}
                    sections={sections}
                    activeSectionId={activeSectionId}
                    onRemove={() => removeVideoFromSection(video.id)}
                    context="section"
                    eventId={eventId}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
