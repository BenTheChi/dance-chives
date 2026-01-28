import { Section } from "@/types/event";
import { FormValues } from "@/components/forms/event-form";

/**
 * Normalizes sections for form submission
 * Ensures all required fields have default values
 * Preserves ALL existing fields - only adds defaults for missing ones
 */
export function normalizeSectionsForForm(
  sections: Section[]
): FormValues["sections"] {
  return sections.map((section) => {
    // First, spread all existing fields to preserve everything
    // Then only override fields that need defaults
    const normalized: FormValues["sections"][number] = {
      // Spread ALL existing fields first to preserve everything
      ...section,
      // Only override with defaults if the field is missing/undefined/null
      // This ensures we don't lose any existing values
      description: section.description ?? "",
      sectionType: section.sectionType ?? "Battle",
      bgColor: section.bgColor || "#ffffff",
      // Ensure arrays exist (but preserve existing arrays)
      videos: section.videos ?? [],
      brackets: section.brackets ?? [],
      // Normalize poster if it exists
      poster: section.poster
        ? {
            ...section.poster,
            type: (section.poster.type || "poster") as "poster",
          }
        : (section.poster ?? null),
    };
    return normalized;
  });
}
