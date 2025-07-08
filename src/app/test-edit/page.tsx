"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNavbar } from "@/components/AppNavbar";
import EventForm from "@/components/forms/event-form";
import { Event } from "@/types/event";
import { editEvent, getEvent } from "@/lib/server_actions/event_actions";
import { FormValues } from "@/components/forms/event-form";

export default function TestEditPage() {
  const router = useRouter();
  // Hardcoded test event ID - replace this with an actual event ID from your database
  const eventId = "test-event-123";

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await getEvent(eventId);

        if (response.error) {
          setError(response.error);
        } else if (response.event) {
          setEvent(response.event as Event);
        } else {
          setError("Event not found");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event data");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleEditSubmit = async (data: FormValues) => {
    try {
      console.log("Editing event with data:", data);

      const response = await editEvent(eventId, data);
      console.log("Edit response:", response);

      if (response.error) {
        console.error("Error updating event:", response.error);
        alert(`Error updating event: ${response.error}`);
      } else {
        console.log("Event updated successfully:", response.event);
        alert("Event updated successfully!");
        // Redirect to the event page
        router.push(`/event/${eventId}`);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred. Check the console for details.");
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <div className="flex flex-col gap-4 p-6 md:px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading event data...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <AppNavbar />
        <div className="flex flex-col gap-4 p-6 md:px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">
                Error Loading Event
              </h2>
              <p className="text-muted-foreground mb-4">
                {error || "Event not found"}
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Test Event ID: {eventId}
                </p>
                <p className="text-sm text-muted-foreground">
                  This is a test page. You need to:
                </p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside">
                  <li>Create an event using the add-event form</li>
                  <li>Copy the event ID from the console logs</li>
                  <li>
                    Replace "test-event-123" in this file with the actual ID
                  </li>
                </ol>
              </div>
              <button
                onClick={() => router.push("/add-event")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mt-4"
              >
                Go to Add Event
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Transform the Event data to match FormValues structure
  const transformEventToFormData = (event: Event): FormValues => {
    return {
      eventDetails: {
        creatorId: event.eventDetails.creatorId,
        title: event.eventDetails.title,
        description: event.eventDetails.description || "",
        address: event.eventDetails.address || "",
        prize: event.eventDetails.prize || "",
        entryCost: event.eventDetails.entryCost || "",
        startDate: event.eventDetails.startDate,
        startTime: event.eventDetails.startTime || "",
        endTime: event.eventDetails.endTime || "",
        schedule: event.eventDetails.schedule || "",
        poster: event.eventDetails.poster,
        city: {
          id: event.eventDetails.city.id,
          name: event.eventDetails.city.name,
          countryCode: event.eventDetails.city.countryCode,
          region: event.eventDetails.city.region,
          population: event.eventDetails.city.population,
        },
      },
      sections: event.sections.map((section) => ({
        ...section,
        hasBrackets: section.brackets.length > 0,
      })),
      roles: event.roles,
      subEvents: event.subEvents,
      gallery: event.gallery,
    };
  };

  const formData = transformEventToFormData(event);

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <h1 className="text-md sm:text-lg md:text-xl font-inter font-bold mt-3">
          Test Edit Dance Event
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          This is a test page for editing events. Event ID: {eventId}
        </p>

        {/* Pass the pre-populated data to EventForm */}
        <EventForm
          initialData={formData}
          onSubmit={handleEditSubmit}
          isEditing={true}
        />
      </div>
    </>
  );
}
