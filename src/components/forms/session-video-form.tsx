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
import { X } from "lucide-react";
import type {
  Control,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import { Video } from "@/types/session";
import { VideoEmbed } from "../VideoEmbed";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { useState, useEffect } from "react";
import { SessionFormValues } from "./session-form";

interface SessionVideoFormProps {
  video: Video;
  videoIndex: number;
  onRemove: () => void;
  control: Control<SessionFormValues>;
  setValue: UseFormSetValue<SessionFormValues>;
  getValues: UseFormGetValues<SessionFormValues>;
}

export function SessionVideoForm({
  video,
  videoIndex,
  onRemove,
  control,
  setValue,
  getValues,
}: SessionVideoFormProps) {
  // Helper to get current form values
  const getFormVideo = (): Video | null => {
    try {
      const videos = getValues("videos") || [];
      if (Array.isArray(videos)) {
        return videos.find((v: Video) => v.id === video.id) || null;
      }
    } catch {
      // Fallback to prop if getValues fails
    }
    return null;
  };

  // Initialize state from form values, fallback to prop
  const initializeState = () => {
    const formVideo = getFormVideo();
    return {
      title: (formVideo?.title || video.title || "") as string,
      src: (formVideo?.src || video.src || "") as string,
    };
  };

  const [currentTitle, setCurrentTitle] = useState(
    () => initializeState().title
  );
  const [currentSrc, setCurrentSrc] = useState(() => initializeState().src);

  // Sync with form field values when component mounts or when switching back to tab
  useEffect(() => {
    const formVideo = getFormVideo();
    if (formVideo) {
      // Always sync from form values to ensure we have the latest
      const formTitle = formVideo.title || "";
      const formSrc = formVideo.src || "";
      setCurrentTitle(formTitle);
      setCurrentSrc(formSrc);
    } else {
      // Fallback to prop values if form values not available
      setCurrentTitle(video.title || "");
      setCurrentSrc(video.src || "");
    }
  }, [video.id, videoIndex]); // Re-sync when video ID or index changes

  // Also sync when form values change (e.g., when switching tabs and coming back)
  useEffect(() => {
    const formVideo = getFormVideo();
    if (formVideo) {
      if (formVideo.title !== undefined) {
        setCurrentTitle(formVideo.title || "");
      }
      if (formVideo.src !== undefined) {
        setCurrentSrc(formVideo.src || "");
      }
    }
  }); // Run on every render to catch form value changes

  const updateVideoStyles = (styles: string[]) => {
    const currentVideos = getValues("videos") || [];
    const updatedVideos = currentVideos.map((v) =>
      v.id === video.id ? { ...v, styles } : v
    );

    setValue("videos", updatedVideos);
  };

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
          name={`videos.${videoIndex}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    field.onChange(e);
                    setCurrentTitle(newValue);
                    // Also update via setValue to ensure form state is updated
                    setValue(`videos.${videoIndex}.title`, newValue);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <FormField
          control={control}
          name={`videos.${videoIndex}.title`}
          render={({ field: titleField }) => (
            <FormField
              control={control}
              name={`videos.${videoIndex}.src`}
              render={({ field: srcField }) => {
                // Always use current form field values for preview - this ensures it works after tab switches
                // The field.value is always the current form state, so it will persist across tab switches
                const displayTitle = (titleField.value ?? "") as string;
                const displaySrc = (srcField.value ?? "") as string;

                return (
                  <>
                    <div>
                      <VideoEmbed title={displayTitle} src={displaySrc} />
                    </div>
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <Input
                          {...srcField}
                          value={srcField.value ?? ""}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            srcField.onChange(e);
                            setCurrentSrc(newValue);
                            // Also update via setValue to ensure form state is updated
                            // This is especially important when used in embedded contexts
                            setValue(`videos.${videoIndex}.src`, newValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </>
                );
              }}
            />
          )}
        />

        <FormField
          control={control}
          name={`videos.${videoIndex}.styles`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dance Styles</FormLabel>
              <FormControl>
                <StyleMultiSelect
                  value={field.value || []}
                  onChange={(styles) => {
                    field.onChange(styles);
                    updateVideoStyles(styles);
                  }}
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

