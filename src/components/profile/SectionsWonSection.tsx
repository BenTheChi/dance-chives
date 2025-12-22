"use client";

import { useMemo } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { Section } from "@/types/event";
import { EventDate } from "@/types/event";

interface WinningSection {
  sectionId: string;
  sectionTitle: string;
  sectionType?: string;
  eventId: string;
  eventTitle: string;
  imageUrl?: string;
  dates?: EventDate[];
  createdAt?: string | Date;
}

interface SectionsWonSectionProps {
  sections: WinningSection[];
}

// Helper function to parse date string (MM/DD/YYYY format)
function parseEventDate(dateStr: string): Date {
  if (dateStr.includes("-")) {
    return new Date(dateStr);
  }
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

// Check if section is in the future
function isSectionInFuture(section: WinningSection): boolean {
  // Try dates first
  if (section.dates && section.dates.length > 0) {
    const firstDate = section.dates[0].date;
    const eventDate = parseEventDate(firstDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }
  // Fall back to createdAt
  if (section.createdAt) {
    const eventDate = new Date(section.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }
  return false;
}

export function SectionsWonSection({ sections }: SectionsWonSectionProps) {
  // Sort sections: ascending for future, descending for past
  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => {
      const isAFuture = isSectionInFuture(a);
      const isBFuture = isSectionInFuture(b);

      // Future sections first, then past
      if (isAFuture && !isBFuture) return -1;
      if (!isAFuture && isBFuture) return 1;

      // Within same category, sort by date
      let dateA = 0;
      let dateB = 0;

      if (a.dates && a.dates.length > 0) {
        dateA = parseEventDate(a.dates[0].date).getTime();
      } else if (a.createdAt) {
        dateA = new Date(a.createdAt).getTime();
      }

      if (b.dates && b.dates.length > 0) {
        dateB = parseEventDate(b.dates[0].date).getTime();
      } else if (b.createdAt) {
        dateB = new Date(b.createdAt).getTime();
      }

      if (isAFuture) {
        return dateA - dateB; // Ascending for future
      } else {
        return dateB - dateA; // Descending for past
      }
    });
  }, [sections]);

  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <h2 className="text-2xl font-bold mb-4">
        Sections Won ({sections.length})
      </h2>
      <div className="bg-primary-dark border-secondary-light border-4 rounded-sm p-4">
        <div className="max-h-[500px] overflow-y-auto">
          <div className="flex flex-col gap-4">
            {sortedSections.map((section: WinningSection) => (
              <SectionCard
                key={section.sectionId}
                section={{
                  id: section.sectionId,
                  title: section.sectionTitle,
                  sectionType: section.sectionType as
                    | Section["sectionType"]
                    | undefined,
                  poster: section.imageUrl ? { url: section.imageUrl } : null,
                  videos: [],
                  brackets: [],
                }}
                eventId={section.eventId}
                eventTitle={section.eventTitle}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

