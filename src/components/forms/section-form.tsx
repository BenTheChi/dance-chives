"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X, Trophy } from "lucide-react";
import { BigAddButton } from "@/components/ui/big-add-button";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
  UseFormRegister,
} from "react-hook-form";
import { Section, Bracket } from "@/types/event";
import { Video } from "@/types/video";
import { BracketForm } from "@/components/forms/bracket-form";
import { VideoForm } from "@/components/forms/video-form";
import { FormValues } from "./event-form";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
import { UserSearchItem } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import UploadFile from "../ui/uploadfile";
import { Image } from "@/types/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDefaultVideoType,
  sectionTypeDisallowsBrackets,
  sectionTypeRequiresBrackets,
  sectionTypeSupportsWinners,
  updateVideoTypeForId,
  VideoType,
} from "@/lib/utils/section-helpers";

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
  register: UseFormRegister<FormValues>;
  activeSectionIndex: number;
  activeSection: Section;
  sections: Section[];
  activeSectionId: string;
  eventId?: string; // Event ID for winner tagging (only in edit mode)
}

export type SectionFormMode = "overview" | "videos" | "brackets";

// Helper function to normalize sections for form (ensures description is always string)
function normalizeSectionsForForm(sections: Section[]): FormValues["sections"] {
  return sections.map((section) => ({
    ...section,
    description: section.description ?? "",
    sectionType: section.sectionType ?? "Battle",
  }));
}

interface SectionFormPropsWithMode extends SectionFormProps {
  mode?: SectionFormMode;
  /**
   * Optional external control for which bracket is active.
   * When provided, SectionForm will treat this as the source of truth
   * and notify changes via onActiveBracketChange.
   */
  externalActiveBracketId?: string | null;
  onActiveBracketChange?: (bracketId: string) => void;
}

export function SectionForm({
  control,
  setValue,
  getValues,
  register,
  activeSectionIndex,
  activeSection,
  sections,
  activeSectionId,
  eventId,
  mode,
  externalActiveBracketId,
  onActiveBracketChange,
}: SectionFormPropsWithMode) {
  const [internalActiveBracketId, setInternalActiveBracketId] = useState(
    activeSection.brackets.length > 0 ? activeSection.brackets[0].id : ""
  );

  const activeBracketId =
    externalActiveBracketId && externalActiveBracketId.length > 0
      ? externalActiveBracketId
      : internalActiveBracketId;

  const handleSetActiveBracketId = (bracketId: string) => {
    if (!externalActiveBracketId) {
      setInternalActiveBracketId(bracketId);
    }
    if (onActiveBracketChange) {
      onActiveBracketChange(bracketId);
    }
  };
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

  // Ensure hasBrackets is set correctly based on section type when editing
  useEffect(() => {
    if (!activeSection) return;

    const requiresBrackets = sectionTypeRequiresBrackets(
      activeSection.sectionType
    );
    const disallowsBrackets = sectionTypeDisallowsBrackets(
      activeSection.sectionType
    );

    // If section type requires brackets but hasBrackets is false, set it to true
    if (requiresBrackets && !activeSection.hasBrackets) {
      const currentSections = getValues("sections");
      const updatedSections = currentSections.map((section) => {
        if (section.id !== activeSectionId) return section;
        return {
          ...section,
          hasBrackets: true,
        };
      });
      setValue(`sections.${activeSectionIndex}.hasBrackets`, true);
      setValue("sections", normalizeSectionsForForm(updatedSections));
    }
    // If section type disallows brackets but hasBrackets is true, set it to false
    else if (disallowsBrackets && activeSection.hasBrackets) {
      const currentSections = getValues("sections");
      const updatedSections = currentSections.map((section) => {
        if (section.id !== activeSectionId) return section;
        return {
          ...section,
          hasBrackets: false,
        };
      });
      setValue(`sections.${activeSectionIndex}.hasBrackets`, false);
      setValue("sections", normalizeSectionsForForm(updatedSections));
    }
  }, [
    activeSectionId,
    activeSection,
    activeSection?.sectionType,
    activeSection?.hasBrackets,
    activeSectionIndex,
    setValue,
    getValues,
  ]);

  const addBracket = () => {
    if (!activeSection) return;

    // Prevent adding brackets if section type disallows them
    if (sectionTypeDisallowsBrackets(activeSection.sectionType)) {
      return;
    }

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

    // Update form state, then set the new active bracket
    setValue("sections", normalizeSectionsForForm(updatedSections), {
      shouldValidate: true,
    });
    handleSetActiveBracketId(newBracket.id);
  };

  const addVideoToSection = () => {
    if (!activeSection) return;

    const defaultVideoType = getDefaultVideoType(activeSection.sectionType);

    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Video ${activeSection.videos.length + 1}`,
      src: "https://example.com/video",
      type: defaultVideoType,
    } as Video; // Type assertion needed since Video is a union type

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

  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    activeSection.videos[0]?.id ?? null
  );

  // Keep the active video in sync with the current section's videos
  useEffect(() => {
    if (!activeSection || !Array.isArray(activeSection.videos)) {
      if (activeVideoId !== null) setActiveVideoId(null);
      return;
    }

    if (activeSection.videos.length === 0) {
      if (activeVideoId !== null) setActiveVideoId(null);
      return;
    }

    const exists = activeSection.videos.some(
      (video) => video.id === activeVideoId
    );
    if (!activeVideoId || !exists) {
      setActiveVideoId(activeSection.videos[0].id);
    }
  }, [activeSectionId, activeSection, activeVideoId]);

  const activeVideo =
    activeVideoId &&
    activeSection.videos.find((video) => video.id === activeVideoId)
      ? activeSection.videos.find((video) => video.id === activeVideoId)
      : null;

  const activeVideoIndex = activeVideo
    ? activeSection.videos.findIndex((video) => video.id === activeVideo.id)
    : -1;

  const resolvedMode: SectionFormMode = mode ?? "overview";

  return (
    <Card>
      <CardContent className="space-y-4">
        {resolvedMode === "overview" && (
          <>
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
              key={`poster-${activeSectionId}`}
              control={control}
              name={`sections.${activeSectionIndex}.poster`}
              render={() => (
                <FormItem className="w-full">
                  <FormLabel>Poster Upload</FormLabel>
                  <FormControl>
                    <UploadFile
                      register={register}
                      name={`sections.${activeSectionIndex}.poster`}
                      onFileChange={(file) => {
                        if (file) {
                          const posterImage = Array.isArray(file)
                            ? file[0]
                            : file;
                          setValue(`sections.${activeSectionIndex}.poster`, {
                            ...posterImage,
                            type: "poster" as const,
                          } as Image);
                        } else {
                          setValue(
                            `sections.${activeSectionIndex}.poster`,
                            null
                          );
                        }
                      }}
                      className="bg-[#E8E7E7]"
                      maxFiles={1}
                      files={activeSection.poster || null}
                    />
                  </FormControl>
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

            {/* Section Winners - only show if section type supports winners */}
            {sectionTypeSupportsWinners(activeSection.sectionType) && (
              <div className="space-y-2">
                <DebouncedSearchMultiSelect<UserSearchItem>
                  onSearch={searchUsers}
                  placeholder="Search users to mark as section winners..."
                  getDisplayValue={(item) =>
                    `${item.displayName} (${item.username})`
                  }
                  getItemId={(item) => item.username}
                  onChange={(users) => {
                    // Update section winners in form state with the complete list
                    const updatedSections = sections.map((section) => {
                      if (section.id !== activeSectionId) return section;
                      return {
                        ...section,
                        winners: users,
                      };
                    });

                    setValue(
                      "sections",
                      normalizeSectionsForForm(updatedSections)
                    );

                    // Update local winners state for display
                    setSectionWinners(users);
                  }}
                  value={sectionWinners}
                  name="sectionWinners"
                  label="Section Winners"
                />
                {sectionWinners.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sectionWinners
                      .filter((winner) => winner && winner.username)
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
          </>
        )}

        {resolvedMode === "brackets" && (
          <div>
            {activeSection.brackets.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                <div className="text-sm text-muted-foreground mb-6">
                  No brackets yet. Let&apos;s create one!
                </div>
                <div className="flex justify-center">
                  <BigAddButton onClick={addBracket} />
                </div>
              </div>
            ) : (
              (() => {
                const bracketIndex = activeSection.brackets.findIndex(
                  (b) => b.id === activeBracketId
                );
                const effectiveBracketIndex =
                  bracketIndex === -1 ? 0 : bracketIndex;
                const bracket = activeSection.brackets[effectiveBracketIndex];

                if (!bracket) {
                  return null;
                }

                return (
                  <BracketForm
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    activeSectionIndex={activeSectionIndex}
                    activeBracketIndex={effectiveBracketIndex}
                    bracket={bracket}
                    sections={sections}
                    activeSectionId={activeSectionId}
                    activeBracketId={bracket.id}
                    eventId={eventId}
                  />
                );
              })()
            )}
          </div>
        )}

        {resolvedMode === "videos" && !activeSection.hasBrackets && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Videos</h3>

            {activeSection.videos.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                <div className="text-sm text-muted-foreground mb-6">
                  No videos yet. Let&apos;s create one!
                </div>
                <div className="flex justify-center">
                  <BigAddButton onClick={addVideoToSection} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-64 space-y-2">
                  {activeSection.videos.map((video) => {
                    const isActive = video.id === activeVideoId;
                    return (
                      <div key={video.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveVideoId(video.id)}
                          className={`flex-1 min-w-0 text-left rounded px-3 py-2 text-sm border ${
                            isActive
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <div className="truncate">
                            {video.title || "Untitled video"}
                          </div>
                        </button>
                        <div className="flex items-center gap-1">
                          <Select
                            value={(video.type || "battle") as VideoType}
                            onValueChange={(value) => {
                              const currentSections =
                                getValues("sections") ?? [];
                              const updated = updateVideoTypeForId(
                                currentSections,
                                {
                                  sectionId: activeSectionId,
                                  videoId: video.id,
                                  context: "section",
                                },
                                value as VideoType
                              );
                              setValue(
                                "sections",
                                normalizeSectionsForForm(updated),
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                }
                              );
                            }}
                          >
                            <SelectTrigger className="w-[90px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="battle">Battle</SelectItem>
                              <SelectItem value="freestyle">
                                Freestyle
                              </SelectItem>
                              <SelectItem value="choreography">
                                Choreo
                              </SelectItem>
                              <SelectItem value="class">Class</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full p-0 text-destructive hover:text-destructive bg-transparent hover:bg-destructive/10"
                            onClick={() => removeVideoFromSection(video.id)}
                            aria-label={`Remove ${video.title || "video"}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-center mt-2">
                    <BigAddButton onClick={addVideoToSection} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {activeVideo && activeVideoIndex !== -1 && (
                    <VideoForm
                      key={activeVideo.id}
                      control={control}
                      setValue={setValue}
                      getValues={getValues}
                      video={activeVideo}
                      videoIndex={activeVideoIndex}
                      sectionIndex={activeSectionIndex}
                      sections={sections}
                      activeSectionId={activeSectionId}
                      context="section"
                      eventId={eventId}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
