"use client";

import { FormValues } from "./forms/competition-form";
import CompetitionForm from "./forms/competition-form";

interface CompetitionFormWrapperProps {
  initialData?: FormValues;
}

export default function CompetitionFormWrapper({
  initialData,
}: CompetitionFormWrapperProps) {
  return <CompetitionForm initialData={initialData} />;
}
