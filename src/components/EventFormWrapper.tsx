"use client";

import type { FormValues } from "./forms/event-form";
import EventForm from "./forms/event-form";

interface EventFormWrapperProps {
  initialData?: FormValues;
}

export default function EventFormWrapper({
  initialData,
}: EventFormWrapperProps) {
  return <EventForm initialData={initialData} />;
}
