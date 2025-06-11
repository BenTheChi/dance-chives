"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SectionForm } from "@/components/forms/section-form";
import { Section, EventDetails, Role, SubEvent, Picture } from "@/types/event";
import { EventDetailsForm } from "./event-details-form";
import RolesForm from "./roles-form";
import { SubEventForm } from "./subevent-form";
import UploadFile from "../ui/uploadfile";
import { addEvent } from "@/lib/server_actions/event_actions";

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

const pictureSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.string(),
  file: z.instanceof(File).nullable(),
});

const eventDetailsSchema = z.object({
  creatorId: z.string(),
  title: z.string(),
  city: z.object({
    id: z.number(),
    name: z.string(),
    countryCode: z.string(),
    region: z.string(),
    population: z.number(),
  }),
  startDate: z.string(),
  description: z.string().optional(),
  schedule: z.string().optional(),
  address: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  prize: z.string().optional(),
  entryCost: z.string().optional(),
  poster: pictureSchema.nullable().optional(),
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
  schedule: z.string().optional(),
  startDate: z.string(),
  address: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  poster: pictureSchema.nullable().optional(),
});

const formSchema = z.object({
  eventDetails: eventDetailsSchema,
  sections: z.array(sectionSchema),
  roles: z.array(roleSchema).optional(),
  subEvents: z.array(subEventSchema),
  gallery: z.array(pictureSchema),
});

export type FormValues = z.infer<typeof formSchema>;

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
        city: {
          id: 1,
          name: "Seattle",
          countryCode: "US",
          region: "WA",
          population: 750000,
        },
        startDate: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        description: "",
        schedule: "",
        address: "",
        startTime: "",
        endTime: "",
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
          user: {
            id: "2",
            displayName: "Jane Doe",
            username: "jane.doe",
          },
        },
      ],
      subEvents: [
        {
          id: "1",
          title: "Battlezone BBQ",
          description: "Battlezone BBQ",
          schedule: "",
          startDate: new Date().toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }),
          address: "",
          startTime: "",
          endTime: "",
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
      gallery: [],
    },
  });

  const { control, register, setValue, watch } = form;

  // Watch the sections array to get the current state
  const sections = watch("sections") ?? [];
  const eventDetails = watch("eventDetails");
  const subEvents = watch("subEvents") ?? [];
  const roles = watch("roles") ?? [];
  const gallery = watch("gallery") ?? [];
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
      startTime: "",
      endTime: "",
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

  const onSubmit = async (data: FormValues) => {
    //Would be nice to have a loading state here with a spinner
    console.log("Form submitted:", data);

    // Handle form submission
    const response = await addEvent(data);
    console.log(response);

    //Pop up a toast here if there's an error

    //If it's successful then redirect to the event page
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubEvent(subEvent.id)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </Button>
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

          {activeMainTab === "Sections" && (
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </Button>
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
            <FormField
              control={control}
              name="gallery"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Photo Gallery</FormLabel>
                  <FormControl>
                    <UploadFile
                      register={register}
                      name="gallery"
                      onFileChange={(files) => {
                        if (files) {
                          setValue("gallery", files as Picture[]);
                        } else {
                          setValue("gallery", []);
                        }
                      }}
                      className="bg-[#E8E7E7]"
                      maxFiles={3}
                      files={gallery || null}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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
