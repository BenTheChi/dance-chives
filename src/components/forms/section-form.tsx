"use client";

import { useState } from "react";
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
import { Plus, X } from "lucide-react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { Section, Bracket, Video } from "@/types/event";
import { BracketForm } from "@/components/forms/bracket-form";
import { VideoForm } from "@/components/forms/video-form";
import { FormValues } from "./event-form";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";

interface SectionFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  activeSectionIndex: number;
  activeSection: Section;
  sections: Section[];
  activeSectionId: string;
}

export function SectionForm({
  control,
  setValue,
  activeSectionIndex,
  activeSection,
  sections,
  activeSectionId,
}: SectionFormProps) {
  const [activeBracketId, setActiveBracketId] = useState(
    activeSection.brackets.length > 0 ? activeSection.brackets[0].id : ""
  );

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
    setValue("sections", updatedSections, { shouldValidate: true });
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

    setValue("sections", updatedSections);

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
      taggedUsers: [],
    };

    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? { ...section, videos: [...section.videos, newVideo] }
        : section
    );

    setValue("sections", updatedSections);
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

    setValue("sections", updatedSections);
  };

  const handleStylesChange = (styles: string[]) => {
    const updatedSections = sections.map((section) =>
      section.id === activeSectionId ? { ...section, styles } : section
    );
    setValue("sections", updatedSections);

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

    setValue("sections", updatedSections, {
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

    setValue("sections", updatedSections);
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

        <FormField
          key={`hasBrackets-${activeSectionId}`}
          control={control}
          name={`sections.${activeSectionIndex}.hasBrackets`}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value}
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
                        activeSectionIndex={activeSectionIndex}
                        activeBracketIndex={bracketIndex}
                        bracket={bracket}
                        sections={sections}
                        activeSectionId={activeSectionId}
                        activeBracketId={activeBracketId}
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
                    video={video}
                    videoIndex={videoIndex}
                    sectionIndex={activeSectionIndex}
                    sections={sections}
                    activeSectionId={activeSectionId}
                    onRemove={() => removeVideoFromSection(video.id)}
                    context="section"
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
