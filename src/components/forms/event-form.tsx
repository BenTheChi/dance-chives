"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage, // add form message to display errors / validation - tentative
} from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner"; // toaster notifications
import { SectionForm } from "@/components/forms/section-form";
import { Section, EventDetails, Role, SubEvent, Picture } from "@/types/event";
import { EventDetailsForm } from "./event-details-form";
import RolesForm from "./roles-form";
import { SubEventForm } from "./subevent-form";
import UploadFile from "../ui/uploadfile";
import { addEvent } from "@/lib/server_actions/event_actions";

// Define the schema for the form with proper validation
const userSearchItemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
});

const videoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Video title is required"), // switch to min for all non-optional
  src: z.string().min(1, "Video source is required"),
  taggedUsers: z.array(userSearchItemSchema).optional(),
});

const bracketSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Bracket title is required"), // switch to min for all non-optional
  videos: z.array(videoSchema),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Section title is required"), // switch to min for all non-optional
  description: z.string().optional(),
  hasBrackets: z.boolean(),
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
  title: z.string().min(1, "Event title is required"), // switch to min for all non-optional
  city: z.object({
    id: z.number(),
    name: z.string().min(1, "City name is required"),
    countryCode: z.string().min(1, "Country code is required"),
    region: z.string().min(1, "Region is required"),
    population: z.number(),
  }),
  startDate: z.string().min(1, "Start date is required"), // switch to min for all non-optional
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
  title: z.string().min(1, "Role title is required"), // switch to min for all non-optional
  user: userSearchItemSchema.nullable(),
});

const subEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Sub-event title is required"), // switch to min for all non-optional
  description: z.string().optional(),
  schedule: z.string().optional(),
  startDate: z.string().min(1, "Sub-event start date is required"), // switch to min for all non-optional
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
  const [isSubmitting, setIsSubmitting] = useState(false); // add state for submitting

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit", // submit mode - onSubmit
    defaultValues: {
      eventDetails: {
        creatorId: "123abc",
        title: "Massive Monkees 2",
        city: {
          id: 128526,
          name: "Seattle",
          countryCode: "US",
          region: "Washington",
          population: 737015,
        },
        startDate: "06/23/2025",
        description: "something something",
        schedule: "1:00 - start",
        address: "2345 street",
        startTime: "08:00",
        endTime: "15:43",
        entryCost: "08",
        prize: "nothing",
        poster: {
          id: "b2e21079-9374-48e0-8227-2030c6ad6ce6",
          title: "addEvent.jpg",
          url: "https://storage.googleapis.com/dance-chives-posters/b2e21079-9374-48e0-8227-2030c6ad6ce6-addEvent.jpg",
          type: "poster",
          file: null,
        },
      },
      roles: [],
      subEvents: [
        {
          id: "1",
          title: "Battlezone BBQ",
          description: "Battlezone BBQ",
          schedule: "",
          startDate: "06/23/2025",
          address: "333 ave",
          startTime: "07:00",
          endTime: "",
          poster: {
            id: "451e8fa8-5096-443a-bb4f-3fcf65843526",
            title: "DSC00020.jpg",
            url: "https://storage.googleapis.com/dance-chives-posters/451e8fa8-5096-443a-bb4f-3fcf65843526-DSC00020.jpg",
            type: "poster",
            file: null,
          },
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
              src: "https://www.youtube.com/watch?v=lNbMSdohIYM",
              taggedUsers: [],
            },
          ],
          brackets: [
            {
              id: "1750720486424",
              title: "Shouldn't be seen",
              videos: [
                {
                  id: "1750720493754",
                  title: "Nope",
                  src: "https://www.youtube.com/watch?v=RNiZy6t-XnA",
                  taggedUsers: [],
                },
              ],
            },
          ],
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
                  src: "https://www.youtube.com/watch?v=lNbMSdohIYM",
                  taggedUsers: [],
                },
              ],
            },
            {
              id: "5",
              title: "Final",
              videos: [
                {
                  id: "1750721038083",
                  title: "Final Battle",
                  src: "https://www.youtube.com/watch?v=zurzKXaG2Kk",
                  taggedUsers: [],
                },
              ],
            },
          ],
        },
      ],
      gallery: [],
    },
  });

  const { control, handleSubmit, setValue, register, watch, formState: { errors } } = form; // add form state to errors

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

  // extract field names from validation errors
  const getFieldNamesFromErrors = (errors: any): string[] => {
    const fieldNames: string[] = [];
    
    const extractFieldNames = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
          if (obj[key].message) {
            // This is a field with an error
            const fieldName = prefix ? `${prefix}.${key}` : key;
            fieldNames.push(fieldName);
          } else {
            // This is a nested object, recurse
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            extractFieldNames(obj[key], newPrefix);
          }
        }
      }
    };
    
    extractFieldNames(errors);
    return fieldNames;
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true); // added loadstate - isSubmitting
    console.log("Form submitted:", data);

    // pulled await into try block
    try {
      // Handle form submission
      const response = await addEvent(data);
      console.log(response);

      // if response.error, show sonner toast error
      if (response.error) {
        toast.error("Failed to create event", {
          description: response.error,
        });
      } else {
        toast.success("Event created successfully!", {
          description: "Your event has been created and is now live.",
        });
        // TODO: Redirect to the event page
        // router.push(`/events/${response.event.id}`);
      }
      // if non res error, log it
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false); // reset loadstate - isSubmitting
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    
    // Extract field names that have validation errors
    const invalidFields = getFieldNamesFromErrors(errors);
    
    // Create a user-friendly message - fields given readability - mapped to better names
    const fieldDisplayNames: { [key: string]: string } = {
      'eventDetails.title': 'Event Title',
      'eventDetails.city.name': 'City Name',
      'eventDetails.city.countryCode': 'Country Code',
      'eventDetails.city.region': 'Region',
      'eventDetails.startDate': 'Start Date',
      'sections': 'Sections',
      'subEvents': 'Sub-events',
      'roles': 'Roles',
    };

    const invalidFieldNames = invalidFields
      .map(field => fieldDisplayNames[field] || field)
      .filter(Boolean);

    if (invalidFieldNames.length > 0) {
      toast.error("Please fix the following fields:", {
        description: invalidFieldNames.join(', '),
        duration: 5000,
      });
    } else {
      toast.error("Please check your form for errors");
    }
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
        <form onSubmit={handleSubmit(onSubmit, onError)}>
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
            {/* button state - isSubmitting */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Event..." : "Finish"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
