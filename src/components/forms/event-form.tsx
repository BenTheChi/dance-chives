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
import {
  Section,
  Bracket,
  Video,
  EventDetails,
  Role,
  SubEvent,
} from "@/types/event";
import { EventDetailsForm } from "./event-details-form";
import RolesForm from "./roles-form";
import { SubEventForm } from "./subevent-form";

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

const eventDetailsSchema = z.object({
  creatorId: z.string(),
  title: z.string(),
  city: z
    .object({
      id: z.number(),
      name: z.string(),
      countryCode: z.string(),
      country: z.string(),
      region: z.string(),
      regionCode: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      timezone: z.string(),
      population: z.number(),
    })
    .nullable(),
  startDate: z.string(),
  description: z.string().optional(),
  address: z.string().optional(),
  time: z.string().optional(),
  prize: z.string().optional(),
  entryCost: z.string().optional(),
  poster: z
    .object({
      id: z.string(),
      title: z.string(),
      src: z.string(),
      type: z.string(),
    })
    .nullable(),
});

const roleSchema = z.object({
  id: z.string(),
  title: z.string(),
  user: userSearchItemSchema.nullable(),
});

const subEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string(),
  address: z.string().optional(),
  time: z.string().optional(),
  poster: z
    .object({
      id: z.string(),
      title: z.string(),
      src: z.string(),
      type: z.string(),
    })
    .nullable(),
});

const formSchema = z.object({
  eventDetails: eventDetailsSchema,
  sections: z.array(sectionSchema).optional(),
  roles: z.array(roleSchema).optional(),
  subEvents: z.array(subEventSchema).optional(),
});

export type FormValues = {
  eventDetails: EventDetails;
  sections?: {
    id: string;
    title: string;
    description?: string;
    hasBrackets?: boolean;
    videos: Video[];
    brackets: Bracket[];
  }[];
  roles?: Role[];
  subEvents?: SubEvent[];
};

export const mockUsers = ["Ben", "Jane", "Jerry", "Steve", "Bob"];

export default function EventForm() {
  const [activeMainTab, setActiveMainTab] = useState("Sections");
  const [activeSectionId, setActiveSectionId] = useState("2");
  const [activeSubEventId, setActiveSubEventId] = useState("1");

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventDetails: {
        creatorId: "1",
        title: "",
        city: null,
        startDate: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        description: "",
        address: "",
        time: "",
        entryCost: "",
        prize: "",
        poster: null,
      },
      roles: [
        {
          id: "1",
          title: "Organizer",
          user: {
            id: "1",
            displayName: "John Doe",
            username: "john.doe",
          },
        },
        {
          id: "2",
          title: "DJ",
          user: null,
        },
      ],
      subEvents: [
        {
          id: "1",
          title: "Battlezone BBQ",
          description: "Battlezone BBQ",
          startDate: new Date().toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }),
          address: "",
          time: "",
          poster: null,
        },
      ],
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

  const { control, register, setValue, watch } = form;

  // Watch the sections array to get the current state
  const sections = watch("sections") ?? [];
  const eventDetails = watch("eventDetails");
  const roles = watch("roles") ?? [];
  const subEvents = watch("subEvents") ?? [];
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const activeSubEvent = subEvents.find((s) => s.id === activeSubEventId);

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

  const addSubEvent = () => {
    const newSubEvent: SubEvent = {
      id: crypto.randomUUID(),
      title: `New SubEvent ${subEvents.length + 1}`,
      startDate: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      address: "",
      time: "",
      description: "",
      poster: null,
    };
    setValue("subEvents", [...subEvents, newSubEvent]);
    setActiveSubEventId(newSubEvent.id);
  };

  const removeSubEvent = (subEventId: string) => {
    const updatedSubEvents = subEvents.filter((s) => s.id !== subEventId);
    setValue("subEvents", updatedSubEvents);

    // If we removed the active subevent, switch to the first available subevent
    if (activeSubEventId === subEventId && updatedSubEvents.length > 0) {
      setActiveSubEventId(updatedSubEvents[0].id);
    }
  };

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted:", data);
    // Handle form submission
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  const activeSectionIndex = sections.findIndex(
    (s) => s.id === activeSectionId
  );

  const activeSubEventIndex = subEvents.findIndex(
    (s) => s.id === activeSubEventId
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">New Event</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)}>
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
            <EventDetailsForm
              control={control}
              setValue={setValue}
              eventDetails={eventDetails as EventDetails}
              register={register}
            />
          )}

          {activeMainTab === "Roles" && (
            <RolesForm
              control={control}
              setValue={setValue}
              roles={roles as Role[]}
            />
          )}

          {activeMainTab === "Subevents" && (
            <div className="space-y-6">
              <div className="flex gap-2 items-center flex-wrap">
                {subEvents.map((subEvent) => (
                  <div key={subEvent.id} className="relative group">
                    <Button
                      type="button"
                      variant={
                        activeSubEventId === subEvent.id ? "default" : "outline"
                      }
                      onClick={() => setActiveSubEventId(subEvent.id)}
                      className="pr-8"
                    >
                      {subEvent.title}
                    </Button>
                    {subEvents.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubEvent(subEvent.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" onClick={addSubEvent} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add SubEvent
                </Button>
              </div>

              {activeSubEvent && (
                <SubEventForm
                  control={control}
                  setValue={setValue}
                  activeSubEventIndex={activeSubEventIndex}
                  activeSubEvent={activeSubEvent}
                  subEvents={subEvents}
                  activeSubEventId={activeSubEventId}
                  register={register}
                />
              )}
            </div>
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
