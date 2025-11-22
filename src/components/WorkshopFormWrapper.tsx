"use client";

import { WorkshopFormValues } from "./forms/workshop-form";
import WorkshopForm from "./forms/workshop-form";

interface WorkshopFormWrapperProps {
  initialData?: WorkshopFormValues;
}

export default function WorkshopFormWrapper({
  initialData,
}: WorkshopFormWrapperProps) {
  return (
    <WorkshopForm
      initialData={initialData}
    />
  );
}
