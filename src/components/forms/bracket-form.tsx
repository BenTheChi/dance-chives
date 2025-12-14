"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchYouTubeOEmbed } from "@/lib/utils/youtube-oembed";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleHoldTimer = useRef<NodeJS.Timeout | null>(null);

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

  const handleAddVideoFromUrl = async () => {
    if (!newVideoUrl.trim()) {
      toast.error("Please enter a YouTube URL.");
      return;
    }
    setIsAddingVideo(true);
    try {
      const activeSection = sections.find((s) => s.id === activeSectionId);
      const defaultVideoType = getDefaultVideoType(activeSection?.sectionType);
      const metadata = await fetchYouTubeOEmbed(newVideoUrl.trim());
      const truncatedTitle =
        metadata.title?.slice(0, 60) || `Video ${bracket.videos.length + 1}`;

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
              brackets: section.brackets.map((b) =>
                b.id === activeBracketId
                  ? { ...b, videos: [...b.videos, newVideo] }
                  : b
              ),
            }
          : section
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
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-sm font-medium">Bracket Title</span>
        {isEditingTitle ? (
          <Input
            value={bracket.title}
            autoFocus
            onChange={(e) => {
              const title = e.target.value;
              const updatedSections = sections.map((section) =>
                section.id === activeSectionId
                  ? {
                      ...section,
                      brackets: section.brackets.map((b) =>
                        b.id === activeBracketId ? { ...b, title } : b
                      ),
                    }
                  : section
              );
              setValue("sections", normalizeSectionsForForm(updatedSections), {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                setIsEditingTitle(false);
              }
            }}
          />
        ) : (
          <div
            className="border rounded-md px-3 py-2 cursor-text"
            onDoubleClick={() => setIsEditingTitle(true)}
            onMouseDown={() => {
              titleHoldTimer.current = setTimeout(
                () => setIsEditingTitle(true),
                500
              );
            }}
            onMouseUp={() => {
              if (titleHoldTimer.current) {
                clearTimeout(titleHoldTimer.current);
                titleHoldTimer.current = null;
              }
            }}
            onMouseLeave={() => {
              if (titleHoldTimer.current) {
                clearTimeout(titleHoldTimer.current);
                titleHoldTimer.current = null;
              }
            }}
          >
            {bracket.title || "Untitled Bracket"}
          </div>
        )}
      </div>

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

      {bracket.videos.length > 0 && (
        <Accordion
          type="single"
          collapsible
          value={activeVideoId ?? undefined}
          onValueChange={(val) => setActiveVideoId(val || null)}
          className="space-y-3"
        >
          {bracket.videos.map((video, index) => (
            <AccordionItem
              key={video.id}
              value={video.id}
              className="border border-border rounded-md overflow-hidden bg-misty-seafoam"
            >
              <div className="bg-misty-seafoam flex items-center gap-3 px-4 py-3">
                <Input
                  value={video.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const updatedSections = sections.map((section) =>
                      section.id === activeSectionId
                        ? {
                            ...section,
                            brackets: section.brackets.map((b) =>
                              b.id === activeBracketId
                                ? {
                                    ...b,
                                    videos: b.videos.map((v) =>
                                      v.id === video.id ? { ...v, title } : v
                                    ),
                                  }
                                : b
                            ),
                          }
                        : section
                    );
                    setValue(
                      "sections",
                      normalizeSectionsForForm(updatedSections),
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                  className="h-9"
                />

                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive outline-none"
                  aria-label={`Remove ${video.title || "video"}`}
                  onClick={() => removeVideoFromBracket(video.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      removeVideoFromBracket(video.id);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </span>

                <AccordionTrigger className="h-9 w-9 shrink-0 rounded-full border border-border p-0 justify-center">
                  <span className="sr-only">Toggle video</span>
                </AccordionTrigger>
              </div>
              <AccordionContent className="px-4 pb-4 bg-misty-seafoam">
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
                  activeBracketId={activeBracketId}
                  context="bracket"
                  eventId={eventId}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
