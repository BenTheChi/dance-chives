"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";
import { CircleXButton } from "@/components/ui/circle-x-button";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { VideoForm } from "./video-form";
import { Section, Bracket, Video } from "@/types/event";
import { DraggableVideoList } from "@/components/forms/draggable-video-list";
import { getBracketDroppableId } from "@/components/forms/draggable-bracket-tabs";
import { fetchYouTubeOEmbed } from "@/lib/utils/youtube-oembed";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getDefaultVideoType } from "@/lib/utils/section-helpers";
import { cn } from "@/lib/utils";

interface BracketFormProps {
  control: Control<any>; // Use any to allow SimpleFormValues or FormValues
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  activeSectionIndex: number;
  activeBracketIndex: number;
  bracket: Bracket;
  sections: Section[];
  updateSections: (sections: Section[]) => void; // New prop to update sections
  activeSectionId: string;
  activeBracketId: string;
  eventId?: string; // Event ID for winner tagging (only in edit mode)
  /** When true, video list uses parent DndContext for cross-bracket drag. */
  useParentDndContext?: boolean;
  /** Index at which to show drop placeholder when dragging a video from another bracket. */
  dropPreview?: number;
}

export function BracketForm({
  control,
  setValue,
  getValues,
  activeSectionIndex,
  bracket,
  sections,
  updateSections,
  activeSectionId,
  activeBracketId,
  eventId,
  useParentDndContext = false,
  dropPreview,
}: BracketFormProps) {
  const droppableId = getBracketDroppableId(activeBracketId);
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

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

    updateSections(updatedSections);
  };

  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);

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
        id: crypto.randomUUID(),
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
                  ? { ...b, videos: [newVideo, ...b.videos] }
                  : b
              ),
            }
          : section
      );

      updateSections(updatedSections);
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
        <label className="text-sm font-medium text-white">Bracket Title</label>
        <Input
          value={bracket.title ?? ""}
          placeholder="Untitled Bracket"
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
            updateSections(updatedSections);
          }}
        />
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

      {(bracket.videos.length > 0 || useParentDndContext) && (
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[80px] rounded-sm transition-colors",
            isOver && "bg-mint/30 ring-2 ring-primary ring-offset-2"
          )}
        >
          {bracket.videos.length > 0 ? (
            <DraggableVideoList
              videos={bracket.videos}
              onReorder={(newOrder) => {
                const updatedSections = sections.map((section) =>
                  section.id === activeSectionId
                    ? {
                        ...section,
                        brackets: section.brackets.map((b) =>
                          b.id === activeBracketId
                            ? { ...b, videos: newOrder }
                            : b
                        ),
                      }
                    : section
                );
                updateSections(updatedSections);
              }}
              onVideoTitleChange={(videoId, title) => {
                const updatedSections = sections.map((section) =>
                  section.id === activeSectionId
                    ? {
                        ...section,
                        brackets: section.brackets.map((b) =>
                          b.id === activeBracketId
                            ? {
                                ...b,
                                videos: b.videos.map((v) =>
                                  v.id === videoId ? { ...v, title } : v
                                ),
                              }
                            : b
                        ),
                      }
                    : section
                );
                updateSections(updatedSections);
              }}
              onVideoRemove={removeVideoFromBracket}
              control={control}
              setValue={setValue}
              getValues={getValues}
              sections={sections}
              updateSections={updateSections}
              sectionIndex={activeSectionIndex}
              activeSectionId={activeSectionId}
              activeBracketId={activeBracketId}
              context="bracket"
              eventId={eventId}
              useParentContext={useParentDndContext}
              insertIndicatorIndex={dropPreview}
            />
          ) : (
            <div className="py-8 text-center text-sm text-charcoal border border-dashed border-charcoal rounded-sm">
              Drop videos here from another bracket
            </div>
          )}
        </div>
      )}
    </div>
  );
}
