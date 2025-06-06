"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./event-form";
import { Section, Video } from "@/types/event";
import { DebouncedSearchMultiSelect } from "@/components/ui/debounced-search-multi-select";
import { UserSearchItem } from "@/types/user";
import { VideoEmbed } from "../VideoEmbed";

interface VideoFormProps {
  video: Video;
  videoIndex: number;
  sectionIndex: number;
  sections: Section[];
  activeSectionId: string;
  activeBracketId?: string;
  context: "section" | "bracket";
  onRemove: () => void;
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

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

export function VideoForm({
  video,
  videoIndex,
  sectionIndex,
  sections,
  activeSectionId,
  activeBracketId,
  context,
  onRemove,
  control,
  setValue,
}: VideoFormProps) {
  const bracketIndex = sections[sectionIndex].brackets.findIndex(
    (b) => b.id === activeBracketId
  );

  const updateTaggedUsers = (users: UserSearchItem[]) => {
    const updatedSections = sections.map((section) => {
      if (section.id !== activeSectionId) return section;

      if (context === "section") {
        return {
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id ? { ...v, taggedUsers: users } : v
          ),
        };
      } else {
        return {
          ...section,
          brackets: section.brackets.map((bracket) =>
            bracket.id === activeBracketId
              ? {
                  ...bracket,
                  videos: bracket.videos.map((v) =>
                    v.id === video.id ? { ...v, taggedUsers: users } : v
                  ),
                }
              : bracket
          ),
        };
      }
    });

    setValue("sections", updatedSections);
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
          name={
            context === "bracket"
              ? `sections.${sectionIndex}.brackets.${bracketIndex}.videos.${videoIndex}.title`
              : `sections.${sectionIndex}.videos.${videoIndex}.title`
          }
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <VideoEmbed title={video.title} src={video.src} />
        </div>

        <FormField
          control={control}
          name={
            context === "bracket"
              ? `sections.${sectionIndex}.brackets.${bracketIndex}.videos.${videoIndex}.src`
              : `sections.${sectionIndex}.videos.${videoIndex}.src`
          }
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DebouncedSearchMultiSelect<UserSearchItem>
          onSearch={searchUsers}
          placeholder="Search users..."
          getDisplayValue={(item) => `${item.displayName} (${item.username})`}
          getItemId={(item) => item.id}
          onChange={updateTaggedUsers}
          value={video.taggedUsers ?? []}
          name="Tagged Users"
        />
      </CardContent>
    </Card>
  );
}
