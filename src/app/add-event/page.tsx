"use client";

import { AppNavbar } from "@/components/AppNavbar";
import AddEventForm from "@/components/forms/add-event-form";
import EventForm from "@/components/forms/event-form";

export default function AddEventPage() {
  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <h1 className="text-md sm:text-lg md:text-xl font-inter font-bold mt-3">
          Create Dance Event
        </h1>
        {/* <AddEventForm /> */}
        <EventForm />
      </div>
    </>
  );
}
