"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SectionForm } from "@/components/forms/section-form";
import { UserSearchItem } from "@/types/user";

// Define the schema for the form
const userSearchItemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
});

const videoSchema = z.object({
  id: z.string(),
  title: z.string(),
  src: z.string(),
  taggedUsers: z.array(userSearchItemSchema).optional(),
});

const bracketSchema = z.object({
  id: z.string(),
  title: z.string(),
  videos: z.array(videoSchema),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  hasBrackets: z.boolean().optional(),
  videos: z.array(videoSchema),
  brackets: z.array(bracketSchema),
});

const formSchema = z.object({
  sections: z.array(sectionSchema).optional(),
});

export type FormValues = {
  sections?: {
    id: string;
    title: string;
    description?: string;
    hasBrackets?: boolean;
    videos: {
      id: string;
      title: string;
      src: string;
      taggedUsers?: UserSearchItem[];
    }[];
    brackets: {
      id: string;
      title: string;
      videos: {
        id: string;
        title: string;
        src: string;
        taggedUsers?: UserSearchItem[];
      }[];
    }[];
  }[];
};

export type Section = {
  id: string;
  title: string;
  description?: string;
  hasBrackets?: boolean;
  videos: {
    id: string;
    title: string;
    src: string;
    taggedUsers?: UserSearchItem[];
  }[];
  brackets: {
    id: string;
    title: string;
    videos: {
      id: string;
      title: string;
      src: string;
      taggedUsers?: UserSearchItem[];
    }[];
  }[];
};

export type Bracket = {
  id: string;
  title: string;
  videos: {
    id: string;
    title: string;
    src: string;
    taggedUsers?: UserSearchItem[];
  }[];
};

export type Video = {
  id: string;
  title: string;
  src: string;
  taggedUsers?: UserSearchItem[];
};

export const mockUsers = ["Ben", "Jane", "Jerry", "Steve", "Bob"];

export default function EventForm() {
  const [activeMainTab, setActiveMainTab] = useState("Sections");
  const [activeSectionId, setActiveSectionId] = useState("2");

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sections: [
        {
          id: "1",
          title: "Judge Showcases",
          description: "",
          hasBrackets: false,
          videos: [
            {
              id: "1",
              title: "Judge Showcase 1",
              src: "https://example.com/video1",
              taggedUsers: [],
            },
            {
              id: "2",
              title: "Judge Showcase 2",
              src: "https://example.com/video2",
              taggedUsers: [
                {
                  id: "1",
                  displayName: "Bob",
                  username: "bob",
                },
              ],
            },
          ],
          brackets: [],
        },
        {
          id: "2",
          title: "1 vs 1 Breaking",
          description:
            "Battlezone is back for its fifteenth edition this year. We're bringing back some local legends, the previous winner, and good vibrations. This year, we will have a 1v1 Breaking category and a 2v2 All-styles category. We hope to see you guys come get down on our floor.",
          hasBrackets: true,
          videos: [],
          brackets: [
            {
              id: "1",
              title: "Prelims",
              videos: [
                {
                  id: "1",
                  title: "Battle 1",
                  src: "https://example.com/battle1",
                  taggedUsers: [],
                },
                {
                  id: "2",
                  title: "Battle 2",
                  src: "https://example.com/battle2",
                  taggedUsers: [
                    {
                      id: "1",
                      displayName: "Ben",
                      username: "ben",
                    },
                  ],
                },
                {
                  id: "3",
                  title: "Battle 3",
                  src: "https://example.com/battle3",
                  taggedUsers: [],
                },
              ],
            },
            { id: "2", title: "Top 16", videos: [] },
            { id: "3", title: "Top 8", videos: [] },
            { id: "4", title: "Top 4", videos: [] },
            { id: "5", title: "Final", videos: [] },
          ],
        },
        {
          id: "3",
          title: "2v2 All Style",
          description: "",
          hasBrackets: false,
          videos: [],
          brackets: [],
        },
      ],
    },
  });

  const { control, setValue, watch } = form;

  // Watch the sections array to get the current state
  const sections = watch("sections") ?? [];
  const activeSection = sections.find((s) => s.id === activeSectionId);

  const mainTabs = [
    "Event Details",
    "Roles",
    "Subevents",
    "Sections",
    "Photo Gallery",
  ];

  const addSection = () => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      title: `New Section ${sections.length + 1}`,
      description: "",
      hasBrackets: false,
      videos: [],
      brackets: [],
    };
    setValue("sections", [...sections, newSection]);
    setActiveSectionId(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    const updatedSections = sections.filter(
      (section) => section.id !== sectionId
    );
    setValue("sections", updatedSections);

    // If we removed the active section, switch to the first available section
    if (activeSectionId === sectionId && updatedSections.length > 0) {
      setActiveSectionId(updatedSections[0].id);
    }
  };

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted:", data);
    // Handle form submission
  };

  const activeSectionIndex = sections.findIndex(
    (s) => s.id === activeSectionId
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">New Event</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Main Navigation - Text Style Tabs */}
          <div className="flex justify-center gap-8 mb-8">
            {mainTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMainTab(tab)}
                className={`text-lg font-medium pb-2 border-b-2 transition-colors ${
                  activeMainTab === tab
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeMainTab === "Event Details" && (
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Event details content goes here</p>
              </CardContent>
            </Card>
          )}

          {activeMainTab === "Roles" && (
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Roles content goes here</p>
              </CardContent>
            </Card>
          )}

          {activeMainTab === "Subevents" && (
            <Card>
              <CardHeader>
                <CardTitle>Subevents</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Subevents content goes here</p>
              </CardContent>
            </Card>
          )}

          {activeMainTab === "Sections" && activeSectionIndex >= 0 && (
            <div className="space-y-6">
              {/* Section Navigation with Remove Icons */}
              <div className="flex gap-2 items-center flex-wrap">
                {sections.map((section) => (
                  <div key={section.id} className="relative group">
                    <Button
                      type="button"
                      variant={
                        activeSectionId === section.id ? "default" : "outline"
                      }
                      onClick={() => setActiveSectionId(section.id)}
                      className="pr-8"
                    >
                      {section.title}
                    </Button>
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(section.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" onClick={addSection} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {/* Section Form Component */}
              {activeSection && (
                <SectionForm
                  control={control}
                  setValue={setValue}
                  activeSectionIndex={activeSectionIndex}
                  activeSection={activeSection}
                  sections={sections}
                  activeSectionId={activeSectionId}
                />
              )}
            </div>
          )}

          {activeMainTab === "Photo Gallery" && (
            <Card>
              <CardHeader>
                <CardTitle>Photo Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Photo gallery content goes here</p>
              </CardContent>
            </Card>
          )}

          {/* Bottom Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button type="button" variant="destructive">
              Cancel
            </Button>
            <Button type="button" variant="outline">
              Previous
            </Button>
            <Button type="button" variant="outline">
              Next
            </Button>
            <Button type="submit">Finish</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
