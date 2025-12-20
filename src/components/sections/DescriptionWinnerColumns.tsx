"use client";

import { Section } from "@/types/event";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TagSelfCircleButton } from "@/components/events/TagSelfCircleButton";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { checkUserWinnerOfSection } from "@/lib/server_actions/request_actions";

interface DescriptionWinnerColumnsProps {
  section: Section;
  eventId: string;
  canTagDirectly: boolean;
  currentUserId?: string;
}

export function DescriptionWinnerColumns({
  section,
  eventId,
  canTagDirectly,
  currentUserId,
}: DescriptionWinnerColumnsProps) {
  const [isUserWinner, setIsUserWinner] = useState(false);
  const [showWinners, setShowWinners] = useState(false);

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
    <>
      {/* Description Column */}
      <div className="bg-misty-seafoam p-4 rounded-sm flex flex-col border-2 border-black md:col-span-1">
        <h2 className="text-xl font-bold text-center">Description</h2>
        {section.description && (
          <p className="whitespace-pre-wrap mt-4">{section.description}</p>
        )}
      </div>

      {/* Winner Column */}
      <div className="bg-misty-seafoam p-4 rounded-sm flex flex-col gap-2 border-2 border-black md:col-span-1">
        <div className="flex flex-row gap-2 justify-center items-baseline">
          <h2 className="text-xl font-bold text-center">Winner</h2>
          {currentUserId && section?.id && (
            <div className="flex justify-center mt-2">
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
                size="sm"
              />
            </div>
          )}
        </div>
        {hasWinners && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="link"
                className="text-xs text-gray-600 hover:text-blue-600 p-0 h-auto"
                onClick={() => setShowWinners(!showWinners)}
              >
                {showWinners ? "hide" : "show"}
              </Button>
            </div>
            {showWinners && (
              <div className="flex flex-wrap gap-1 items-center justify-center">
                {Array.from(
                  new Map(
                    section
                      .winners!.filter((w) => w && w.id)
                      .map((w) => [w.id, w])
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
            )}
          </div>
        )}
      </div>
    </>
  );
}
