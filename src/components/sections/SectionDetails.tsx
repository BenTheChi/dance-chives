"use client";

import { Section } from "@/types/event";
import { StyleBadge } from "@/components/ui/style-badge";
import { useEffect, useState } from "react";
import { checkUserWinnerOfSection } from "@/lib/server_actions/request_actions";
import { formatTimeToAMPM } from "@/lib/utils/calendar-utils";
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
  const formattedStart = section.startTime
    ? formatTimeToAMPM(section.startTime)
    : null;
  const formattedEnd = section.endTime
    ? formatTimeToAMPM(section.endTime)
    : null;
  const timeRange =
    formattedStart && formattedEnd
      ? `${formattedStart} - ${formattedEnd}`
      : formattedStart;
  const dateTimeDisplay =
    section.date && formattedStart ? (
      <div className="flex flex-col text-center gap-1 mb-2">
        <span className="uppercase">{section.date}</span>
        {timeRange && <span className="italic">{timeRange}</span>}
      </div>
    ) : null;

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
        <h2 className="text-center mb-2 !text-4xl !font-bold">
          {section.title}
        </h2>
        {dateTimeDisplay}

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
