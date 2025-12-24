"use client";

import { Section } from "@/types/event";
import { StyleBadge } from "@/components/ui/style-badge";
import { TagSelfCircleButton } from "@/components/events/TagSelfCircleButton";
import { useEffect, useState } from "react";
import { checkUserWinnerOfSection } from "@/lib/server_actions/request_actions";
import Link from "next/link";

interface SectionDetailsProps {
  section: Section;
  displayStyles: string[];
  eventId: string;
  eventTitle: string;
  canTagDirectly: boolean;
  currentUserId?: string;
}

export function SectionDetails({
  section,
  displayStyles,
  eventId,
  eventTitle,
  canTagDirectly,
  currentUserId,
}: SectionDetailsProps) {
  const [isUserWinner, setIsUserWinner] = useState(false);

  // Check if current user is winner of section
  useEffect(() => {
    const checkWinnerStatus = async () => {
      if (currentUserId && section?.id) {
        try {
          const isWinner = await checkUserWinnerOfSection(
            eventId,
            section.id,
            currentUserId
          );
          setIsUserWinner(isWinner);
        } catch (error) {
          console.error("Error checking winner status:", error);
          setIsUserWinner(false);
        }
      } else {
        setIsUserWinner(false);
      }
    };
    checkWinnerStatus();
  }, [currentUserId, section, eventId]);

  return (
    <section className="border-4 border-primary-light py-4 px-4 bg-primary-dark rounded-sm w-full flex flex-col">
      <div className="flex flex-col">
        {/* Event Title | Section Type */}
        <div className="flex flex-row gap-1 items-center justify-center mb-4">
          <Link
            href={`/events/${eventId}`}
            className="hover:text-primary-light hover:underline transition-colors"
          >
            <h2>{eventTitle}</h2>
          </Link>

          {section.sectionType && (
            <h2>
              {` | `}
              {section.sectionType}
            </h2>
          )}
        </div>

        {/* Style badges */}
        {displayStyles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 sm:mb-10 justify-center">
            {displayStyles.map((style) => (
              <StyleBadge key={style} style={style} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
