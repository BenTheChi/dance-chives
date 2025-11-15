"use client";

import { SessionFormValues } from "./forms/session-form";
import SessionForm from "./forms/session-form";

interface SessionFormWrapperProps {
  initialData?: SessionFormValues;
}

export default function SessionFormWrapper({
  initialData,
}: SessionFormWrapperProps) {
  return <SessionForm initialData={initialData} />;
}

