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

// Helper function to normalize sections for form (ensures description is always string)
function normalizeSectionsForForm(sections: Section[]): FormValues["sections"] {
  return sections.map((section) => ({
    ...section,
    description: section.description ?? "",
    sectionType: section.sectionType ?? "Other",
  }));
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

  // Get default video type based on section type
  const getDefaultVideoType = (sectionType?: string): Video["type"] => {
    switch (sectionType) {
      case "Battle":
        return "battle";
      case "Competition":
      case "Performance":
        return "choreography";
      case "Showcase":
      case "Session":
        return "freestyle";
      case "Class":
        return "class";
      default:
        return "battle"; // Default for Tournament, Mixed, Other, or undefined
    }
  };

  // Check if section type supports winners
  const sectionTypeSupportsWinners = (sectionType?: string): boolean => {
    return ["Battle", "Tournament", "Competition"].includes(sectionType || "");
  };

  // Check if section type requires brackets
  const sectionTypeRequiresBrackets = (sectionType?: string): boolean => {
    return ["Battle", "Tournament"].includes(sectionType || "");
  };

  // Check if section type disallows brackets (for performance reasons)
  const sectionTypeDisallowsBrackets = (sectionType?: string): boolean => {
    return ["Showcase", "Class", "Session", "Performance"].includes(
      sectionType || ""
    );
  };

  // Handle section type change
  const handleSectionTypeChange = (newType: string | undefined) => {
    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) return section;

      const requiresBrackets = sectionTypeRequiresBrackets(newType);
      const disallowsBrackets = sectionTypeDisallowsBrackets(newType);
      const supportsWinners = sectionTypeSupportsWinners(newType);
      const defaultVideoType = getDefaultVideoType(newType);

      // If changing to a type that doesn't support winners, remove winners
      const winners = supportsWinners ? section.winners || [] : [];

      // If changing to a type that requires brackets, ensure hasBrackets is true
      // If changing to a type that disallows brackets, ensure hasBrackets is false
      // Otherwise, keep current hasBrackets (user can still enable/disable)
      const hasBrackets = requiresBrackets
        ? true
        : disallowsBrackets
        ? false
        : section.hasBrackets;

      // Handle brackets based on section type and hasBrackets setting:
      // - If type requires brackets OR (hasBrackets is true AND type doesn't disallow): keep brackets, update video types
      // - If type disallows brackets OR (type doesn't require brackets AND hasBrackets is false): clear brackets
      const shouldKeepBrackets =
        requiresBrackets || (hasBrackets && !disallowsBrackets);

      // Collect videos from brackets if we're clearing them (to preserve them)
      const videosFromBrackets =
        disallowsBrackets && section.brackets.length > 0
          ? section.brackets.flatMap((bracket) =>
              bracket.videos.map((video) => ({
                ...video,
                type: defaultVideoType,
              }))
            )
          : [];

      const updatedBrackets = shouldKeepBrackets
        ? section.brackets.map((bracket) => ({
            ...bracket,
            videos: bracket.videos.map((video) => ({
              ...video,
              type: defaultVideoType,
            })),
          }))
        : []; // Clear brackets if section type disallows them or doesn't require them and hasBrackets is false

      // Update all existing videos to use the default video type for this section type
      // If brackets are being cleared, merge videos from brackets into direct videos
      const updatedVideos = [
        ...section.videos.map((video) => ({
          ...video,
          type: defaultVideoType,
        })),
        ...videosFromBrackets,
      ];

      return {
        ...section,
        sectionType: newType as Section["sectionType"],
        hasBrackets,
        winners,
        videos: updatedVideos,
        brackets: updatedBrackets,
      };
    });

    setValue("sections", normalizeSectionsForForm(updatedSections));

    // Update local winners state if winners were removed
    if (!sectionTypeSupportsWinners(newType)) {
      setSectionWinners([]);
    }

    // If brackets were cleared, reset active bracket ID
    const updatedSection = updatedSections.find(
      (s) => s.id === activeSectionId
    );
    if (updatedSection && updatedSection.brackets.length === 0) {
      setActiveBracketId("");
    } else if (updatedSection && updatedSection.brackets.length > 0) {
      // If brackets still exist, ensure active bracket ID is valid
      const bracketIds = updatedSection.brackets.map((b) => b.id);
      if (!bracketIds.includes(activeBracketId)) {
        setActiveBracketId(updatedSection.brackets[0].id);
      }
    }
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
                      const posterImage = Array.isArray(file) ? file[0] : file;
                      setValue(`sections.${activeSectionIndex}.poster`, {
                        ...posterImage,
                        type: "poster" as const,
                      } as Image);
                    } else {
                      setValue(`sections.${activeSectionIndex}.poster`, null);
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

        <FormField
          key={`sectionType-${activeSectionId}`}
          control={control}
          name={`sections.${activeSectionIndex}.sectionType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section Type</FormLabel>
              <Select
                value={field.value || "Other"}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleSectionTypeChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Battle">Battle</SelectItem>
                  <SelectItem value="Class">Class</SelectItem>
                  <SelectItem value="Competition">Competition</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Performance">Performance</SelectItem>
                  <SelectItem value="Session">Session</SelectItem>
                  <SelectItem value="Showcase">Showcase</SelectItem>
                  <SelectItem value="Tournament">Tournament</SelectItem>
                </SelectContent>
              </Select>
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

                setValue("sections", normalizeSectionsForForm(updatedSections));

                // Update local winners state for display
                setSectionWinners(users);
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

        <FormField
          key={`hasBrackets-${activeSectionId}`}
          control={control}
          name={`sections.${activeSectionIndex}.hasBrackets`}
          render={({ field }) => {
            const requiresBrackets = sectionTypeRequiresBrackets(
              activeSection.sectionType
            );
            const disallowsBrackets = sectionTypeDisallowsBrackets(
              activeSection.sectionType
            );
            const isDisabled = requiresBrackets || disallowsBrackets; // Disable if section type requires or disallows brackets

            return (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                      }}
                    />
                  </FormControl>
                  <FormLabel>
                    Use Brackets
                    {requiresBrackets && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Required for {activeSection.sectionType} sections)
                      </span>
                    )}
                    {disallowsBrackets && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Not available for {activeSection.sectionType} sections)
                      </span>
                    )}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
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
