"use client";

import AddEventForm from "@/components/forms/add-event-form";

export default function AddEventPage() {
  return (
    <main className="flex flex-col gap-4 bg-[#E8E7E7] w-full p-6 md:p-15">
      <h1 className="text-md sm:text-lg md:text-xl font-inter font-bold mt-3">
        Create Dance Event
      </h1>
      <AddEventForm />
    </main>
  );
}