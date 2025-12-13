"use client";

import { Section } from "@/types/event";
import { StyleBadge } from "@/components/ui/style-badge";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TagSelfCircleButton } from "@/components/events/TagSelfCircleButton";
import { useEffect, useState } from "react";
import { checkUserWinnerOfSection } from "@/lib/server_actions/request_actions";

interface SectionDetailsProps {
  section: Section;
  displayStyles: string[];
  eventId: string;
  canTagDirectly: boolean;
  currentUserId?: string;
}

export function SectionDetails({
  section,
  displayStyles,
  eventId,
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
    <>
      {/* Section Details */}
      <section className="bg-blue-100 p-4 rounded-md flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{section.title}</h1>
        {section.sectionType && (
          <div className="flex flex-row gap-2 items-center">
            <b>Type:</b>
            <Badge variant="outline">{section.sectionType}</Badge>
          </div>
        )}
        {displayStyles.length > 0 && (
          <div className="flex flex-row gap-2 items-center flex-wrap">
            <b>Styles:</b>
            <div className="flex flex-wrap gap-1">
              {displayStyles.map((style) => (
                <StyleBadge key={style} style={style} />
              ))}
            </div>
          </div>
        )}
        {section.description && (
          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
            {section.description}
          </p>
        )}
      </section>

      {/* Winners Section */}
      <section className="bg-green-100 p-4 rounded-md flex flex-col gap-2">
        <h2 className="text-xl font-bold mb-2">Winners</h2>
        {section.winners && section.winners.length > 0 ? (
          <div className="flex flex-wrap gap-1 items-center">
            {Array.from(
              new Map(
                section.winners.filter((w) => w && w.id).map((w) => [w.id, w])
              ).values()
            ).map((winner) =>
              winner.username ? (
                <UserAvatar
                  key={winner.id}
                  username={winner.username}
                  displayName={winner.displayName}
                  avatar={(winner as any).avatar}
                  image={(winner as any).image}
                />
              ) : (
                <span key={winner.id}>{winner.displayName}</span>
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No winners yet.</p>
        )}
        {currentUserId && section?.id && (
          <div className="mt-2">
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
    </>
  );
}
