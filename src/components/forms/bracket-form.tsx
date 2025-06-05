"use client";

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
import { Plus } from "lucide-react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { VideoForm } from "./video-form";
import { FormValues } from "./event-form";
import { Section, Bracket, Video } from "@/types/event";

interface BracketFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  activeSectionIndex: number;
  activeBracketIndex: number;
  bracket: Bracket;
  sections: Section[];
  activeSectionId: string;
  activeBracketId: string;
}

export function BracketForm({
  control,
  setValue,
  activeSectionIndex,
  activeBracketIndex,
  bracket,
  sections,
  activeSectionId,
  activeBracketId,
}: BracketFormProps) {
  const addVideoToBracket = () => {
    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Video ${bracket.videos.length + 1}`,
      src: "https://example.com/video",
      taggedUsers: [],
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

    setValue("sections", updatedSections);
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

    setValue("sections", updatedSections);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bracket Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="flex justify-between items-center">
          <h4 className="text-md font-semibold">Videos</h4>
          <Button
            type="button"
            onClick={addVideoToBracket}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bracket.videos.map((video, videoIndex) => (
            <VideoForm
              key={`${activeBracketId}-${video.id}-${videoIndex}`}
              control={control}
              setValue={setValue}
              video={video}
              videoIndex={videoIndex}
              sectionIndex={activeSectionIndex}
              sections={sections}
              activeSectionId={activeSectionId}
              activeBracketId={activeBracketId}
              onRemove={() => removeVideoFromBracket(video.id)}
              context="bracket"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
