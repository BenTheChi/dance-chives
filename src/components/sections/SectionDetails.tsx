"use client";

import { Section } from "@/types/event";
import { StyleBadge } from "@/components/ui/style-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
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

  const hasWinners = section.winners && section.winners.length > 0;

  return (
    <section className="bg-misty-seafoam p-6 rounded-md flex flex-col gap-4 border border-black">
      <div>
        <h1 className="text-3xl font-bold">{section.title}</h1>
        <div className="text-xl text-muted-foreground font-semibold">
          <Link
            href={`/events/${eventId}`}
            className="text-gray-600 hover:text-blue-600 hover:underline transition-colors"
          >
            {eventTitle}
          </Link>
          {section.sectionType && (
            <span className="text-muted-foreground">
              {` | `}
              {section.sectionType}
            </span>
          )}
        </div>
      </div>

      {displayStyles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {displayStyles.map((style) => (
            <StyleBadge key={style} style={style} />
          ))}
        </div>
      )}

      {section.description && (
        <p className="whitespace-pre-wrap">{section.description}</p>
      )}

      {hasWinners && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Winners</h2>
          <div className="flex flex-wrap gap-1 items-center">
            {Array.from(
              new Map(
                section.winners!.filter((w) => w && w.id).map((w) => [w.id, w])
              ).values()
            ).map((winner) =>
              winner.username ? (
                <UserAvatar
                  key={winner.id}
                  username={winner.username}
                  displayName={winner.displayName}
                  avatar={(winner as any).avatar}
                  image={(winner as any).image}
                  showHoverCard
                  city={(winner as any).city || ""}
                  styles={(winner as any).styles}
                />
              ) : (
                <span key={winner.id}>{winner.displayName}</span>
              )
            )}
          </div>
        </div>
      )}

      {currentUserId && section?.id && (
        <div>
          <TagSelfCircleButton
            eventId={eventId}
            target="section"
            targetId={section.id}
            currentUserId={currentUserId}
            isUserTagged={isUserWinner}
            canTagDirectly={canTagDirectly}
            pendingLabel="Winner tag request pending"
            successLabel="Tagged as Winner"
            dialogTitle={`Tag yourself as a winner of ${section.title}?`}
          />
        </div>
      )}
    </section>
  );
}
