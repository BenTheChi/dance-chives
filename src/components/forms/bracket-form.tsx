"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { BigAddButton } from "@/components/ui/big-add-button";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { VideoForm } from "./video-form";
import { FormValues } from "./event-form";
import { Section, Bracket, Video } from "@/types/event";
import { updateVideoTypeForId, VideoType } from "@/lib/utils/section-helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to normalize sections for form (ensures description is always string)
function normalizeSectionsForForm(sections: Section[]): FormValues["sections"] {
  return sections.map((section) => ({
    ...section,
    description: section.description ?? "",
  }));
}

interface BracketFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  getValues: UseFormGetValues<FormValues>;
  activeSectionIndex: number;
  activeBracketIndex: number;
  bracket: Bracket;
  sections: Section[];
  activeSectionId: string;
  activeBracketId: string;
  eventId?: string; // Event ID for winner tagging (only in edit mode)
}

export function BracketForm({
  control,
  setValue,
  getValues,
  activeSectionIndex,
  activeBracketIndex,
  bracket,
  sections,
  activeSectionId,
  activeBracketId,
  eventId,
}: BracketFormProps) {
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
        return "battle"; // Default for Tournament, Mixed, or undefined
    }
  };

  const addVideoToBracket = () => {
    const activeSection = sections.find((s) => s.id === activeSectionId);
    const defaultVideoType = getDefaultVideoType(activeSection?.sectionType);

    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Video ${bracket.videos.length + 1}`,
      src: "https://example.com/video",
      type: defaultVideoType,
    };

    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? {
            ...section,
            brackets: section.brackets.map((b) =>
              b.id === activeBracketId
                ? { ...b, videos: [...b.videos, newVideo] }
                : b
            ),
          }
        : section
    );

    setValue("sections", normalizeSectionsForForm(updatedSections));
  };

  const removeVideoFromBracket = (videoId: string) => {
    const updatedVideos = bracket.videos.filter(
      (video) => video.id !== videoId
    );
    const updatedSections = sections.map((section) =>
      section.id === activeSectionId
        ? {
            ...section,
            brackets: section.brackets.map((b) =>
              b.id === activeBracketId ? { ...b, videos: updatedVideos } : b
            ),
          }
        : section
    );

    setValue("sections", normalizeSectionsForForm(updatedSections));
  };

  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    bracket.videos[0]?.id ?? null
  );

  // Keep activeVideoId in sync with the current bracket's videos
  useEffect(() => {
    if (!bracket.videos || bracket.videos.length === 0) {
      if (activeVideoId !== null) {
        setActiveVideoId(null);
      }
      return;
    }

    const exists = bracket.videos.some((video) => video.id === activeVideoId);
    if (!activeVideoId || !exists) {
      setActiveVideoId(bracket.videos[0].id);
    }
  }, [bracket.videos, activeVideoId]);

  const activeVideo =
    activeVideoId && bracket.videos.find((video) => video.id === activeVideoId)
      ? bracket.videos.find((video) => video.id === activeVideoId)
      : null;

  const activeVideoIndex = activeVideo
    ? bracket.videos.findIndex((video) => video.id === activeVideo.id)
    : -1;

  return (
    <div className="space-y-2">
      <FormField
        control={control}
        name={`sections.${activeSectionIndex}.brackets.${activeBracketIndex}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bracket Title</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <h4 className="text-md font-semibold">Videos</h4>

      {bracket.videos.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground mb-6">
            No videos yet. Let&apos;s create one!
          </div>
          <div className="flex justify-center">
            <BigAddButton onClick={addVideoToBracket} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-64 space-y-2">
            {bracket.videos.map((video) => {
              const isActive = video.id === activeVideoId;
              return (
                <div key={video.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveVideoId(video.id)}
                    className={`flex-1 text-left rounded px-3 py-2 text-sm border ${
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
                        const currentSections = getValues("sections") ?? [];
                        const updated = updateVideoTypeForId(
                          currentSections,
                          {
                            sectionId: activeSectionId,
                            bracketId: activeBracketId,
                            videoId: video.id,
                            context: "bracket",
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
                        <SelectItem value="freestyle">Freestyle</SelectItem>
                        <SelectItem value="choreography">Choreo</SelectItem>
                        <SelectItem value="class">Class</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full p-0 text-destructive hover:text-destructive bg-transparent hover:bg-destructive/10"
                      onClick={() => removeVideoFromBracket(video.id)}
                      aria-label={`Remove ${video.title || "video"}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-center mt-2">
              <BigAddButton onClick={addVideoToBracket} />
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
                activeBracketId={activeBracketId}
                context="bracket"
                eventId={eventId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
