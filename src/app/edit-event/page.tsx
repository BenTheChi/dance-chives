"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditEventInputPage() {
  const router = useRouter();
  const [eventId, setEventId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventId.trim()) {
      router.push(`/event/${eventId.trim()}/edit`);
    }
  };

  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <h1 className="text-md sm:text-lg md:text-xl font-inter font-bold mt-3">
          Edit Event
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Enter an event ID to edit an existing event.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <div>
            <Label htmlFor="eventId">Event ID</Label>
            <Input
              id="eventId"
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Enter event ID (e.g., abc123)"
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={!eventId.trim()}>
            Edit Event
          </Button>
        </form>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">How to get an Event ID:</h3>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
            <li>
              Go to{" "}
              <a href="/add-event" className="text-primary hover:underline">
                Add Event
              </a>{" "}
              and create a test event
            </li>
            <li>Check the browser console for the event ID in the logs</li>
            <li>Copy the event ID and paste it above</li>
            <li>Click "Edit Event" to test the edit functionality</li>
          </ol>
        </div>

        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/test-edit")}>
            Go to Test Edit Page
          </Button>
        </div>
      </div>
    </>
  );
}
