"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";
import { CircleXButton } from "@/components/ui/circle-x-button";
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
import { Image } from "@/types/image";
import {
  getDefaultVideoType,
  sectionTypeDisallowsBrackets,
  sectionTypeRequiresBrackets,
  sectionTypeSupportsWinners,
  sectionTypeSupportsJudges,
  updateVideoTypeForId,
  VideoType,
} from "@/lib/utils/section-helpers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchYouTubeOEmbed } from "@/lib/utils/youtube-oembed";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PosterUpload } from "../ui/poster-upload";
import { Card, CardContent } from "@/components/ui/card";

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
    bgColor: section.bgColor || "#ffffff",
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
  const [sectionJudges, setSectionJudges] = useState<UserSearchItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);

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

  // Load existing section judges from activeSection.judges
  // Use a Map to deduplicate judges by username
  useEffect(() => {
    if (activeSection?.judges && Array.isArray(activeSection.judges)) {
      // Deduplicate judges by username to prevent duplicates
      const uniqueJudges = Array.from(
        new Map(
          activeSection.judges
            .filter((j) => j && j.username)
            .map((j) => [j.username, j])
        ).values()
      );
      setSectionJudges(uniqueJudges);
    } else {
      setSectionJudges([]);
    }
  }, [activeSectionId, activeSection?.judges]);

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

  const resolvedMode: SectionFormMode = mode ?? "overview";

  const handleAddVideoFromUrl = async () => {
    if (!newVideoUrl.trim()) {
      toast.error("Please enter a YouTube URL.");
      return;
    }
    setIsAddingVideo(true);
    try {
      const metadata = await fetchYouTubeOEmbed(newVideoUrl.trim());
      const defaultVideoType = getDefaultVideoType(activeSection.sectionType);
      const truncatedTitle =
        metadata.title?.slice(0, 60) ||
        `Video ${activeSection.videos.length + 1}`;

      const newVideo: Video = {
        id: Date.now().toString(),
        title: truncatedTitle,
        src: newVideoUrl.trim(),
        thumbnailUrl: metadata.thumbnail_url,
        type: defaultVideoType,
      };

      const updatedSections = sections.map((section) =>
        section.id === activeSectionId
          ? {
              ...section,
              videos: [newVideo, ...section.videos],
              description: section.description ?? "",
            }
          : { ...section, description: section.description ?? "" }
      );

      setValue("sections", normalizeSectionsForForm(updatedSections), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setActiveVideoId(newVideo.id);
      setNewVideoUrl("");
    } catch (error) {
      console.error(error);
      toast.error("Could not fetch video info. Please check the URL.");
    } finally {
      setIsAddingVideo(false);
    }
  };

  return (
    <Card className="bg-misty-seafoam">
      <CardContent className="space-y-4">
        {resolvedMode === "overview" && (
          <>
            <FormField
              key={`poster-${activeSectionId}`}
              control={control}
              name={`sections.${activeSectionIndex}.poster`}
              render={() => (
                <FormItem className="w-full">
                  <FormLabel>Poster Upload</FormLabel>
                  <FormControl>
                    <PosterUpload
                      initialPoster={activeSection.poster?.url || null}
                      initialPosterFile={activeSection.poster?.file || null}
                      initialBgColor={activeSection.bgColor || "#ffffff"}
                      onFileChange={({ file, bgColor }) => {
                        setValue(
                          `sections.${activeSectionIndex}.bgColor`,
                          bgColor,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          }
                        );

                        if (file) {
                          const posterImage: Image = {
                            id: activeSection.poster?.id || crypto.randomUUID(),
                            title:
                              activeSection.poster?.title || "Section Poster",
                            url: activeSection.poster?.url || "",
                            type: "poster",
                            file,
                          };

                          setValue(
                            `sections.${activeSectionIndex}.poster`,
                            posterImage,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            }
                          );
                        } else {
                          setValue(
                            `sections.${activeSectionIndex}.poster`,
                            null,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            }
                          );
                        }
                      }}
                      editable={Boolean(eventId)}
                      maxFiles={1}
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
              </div>
            )}

            {/* Section Judges - only show if section type supports judges */}
            {sectionTypeSupportsJudges(activeSection.sectionType) && (
              <div className="space-y-2">
                <DebouncedSearchMultiSelect<UserSearchItem>
                  onSearch={searchUsers}
                  placeholder="Search users to mark as section judges..."
                  getDisplayValue={(item) =>
                    `${item.displayName} (${item.username})`
                  }
                  getItemId={(item) => item.username}
                  onChange={(users) => {
                    // Update section judges in form state with the complete list
                    const updatedSections = sections.map((section) => {
                      if (section.id !== activeSectionId) return section;
                      return {
                        ...section,
                        judges: users,
                      };
                    });

                    setValue(
                      "sections",
                      normalizeSectionsForForm(updatedSections)
                    );

                    // Update local judges state for display
                    setSectionJudges(users);
                  }}
                  value={sectionJudges}
                  name="sectionJudges"
                  label="Section Judges"
                />
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
              <div className="border rounded-sm p-6 text-center">
                <div className="text-sm text-muted-foreground mb-6">
                  No brackets yet. Let&apos;s create one!
                </div>
                <div className="flex justify-center">
                  <CirclePlusButton size="lg" onClick={addBracket} />
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

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter YouTube URL"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                />
              </div>
              {isAddingVideo ? (
                <div className="rounded-full bg-pulse-green border border-charcoal w-[50px] h-[50px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                </div>
              ) : (
                <CirclePlusButton size="lg" onClick={handleAddVideoFromUrl} />
              )}
            </div>

            {activeSection.videos.length > 0 && (
              <Accordion
                type="single"
                collapsible
                value={activeVideoId ?? undefined}
                onValueChange={(val) => setActiveVideoId(val || null)}
                className="space-y-3"
              >
                {activeSection.videos.map((video, index) => (
                  <AccordionItem
                    key={video.id}
                    value={video.id}
                    className="border border-border rounded-sm bg-periwinkle-light/50 last:border-b"
                  >
                    <div className="bg-periwinkle-light/50 flex items-center gap-3 px-4 py-3">
                      <Input
                        value={video.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          const currentSections = getValues("sections") ?? [];
                          const updated = currentSections.map((section) => {
                            if (section.id !== activeSectionId) return section;
                            return {
                              ...section,
                              videos: section.videos.map((v) =>
                                v.id === video.id ? { ...v, title } : v
                              ),
                            };
                          });
                          setValue(
                            "sections",
                            normalizeSectionsForForm(updated),
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        }}
                        className="h-9"
                      />

                      <div className="flex items-center gap-5 px-3">
                        <AccordionTrigger className="h-9 w-9 shrink-0 rounded-full border border-charcoal flex items-center justify-center [&>svg]:text-charcoal">
                          <span className="sr-only">Toggle video</span>
                        </AccordionTrigger>

                        <CircleXButton
                          size="md"
                          aria-label={`Remove ${video.title || "video"}`}
                          onClick={() => removeVideoFromSection(video.id)}
                        />
                      </div>
                    </div>
                    <AccordionContent className="px-4 pb-4 bg-periwinkle-light/50">
                      <VideoForm
                        key={video.id}
                        control={control}
                        setValue={setValue}
                        getValues={getValues}
                        video={video}
                        videoIndex={index}
                        sectionIndex={activeSectionIndex}
                        sections={sections}
                        activeSectionId={activeSectionId}
                        context="section"
                        eventId={eventId}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
