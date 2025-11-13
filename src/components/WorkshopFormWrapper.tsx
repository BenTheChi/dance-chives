"use client";

import { WorkshopFormValues } from "./forms/workshop-form";
import WorkshopForm from "./forms/workshop-form";

interface WorkshopFormWrapperProps {
  initialData?: WorkshopFormValues;
  hideEventAssociation?: boolean;
  parentEventId?: string;
}

export default function WorkshopFormWrapper({
  initialData,
  hideEventAssociation = false,
  parentEventId,
}: WorkshopFormWrapperProps) {
  return (
    <WorkshopForm
      initialData={initialData}
      hideEventAssociation={hideEventAssociation}
      parentEventId={parentEventId}
    />
  );
}
