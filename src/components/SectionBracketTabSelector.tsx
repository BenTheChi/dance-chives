"use client";

import { Section } from "@/types/event";
import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { StyleBadge } from "./ui/style-badge";
import { useSession } from "next-auth/react";
import VideoGallery from "./VideoGallery";
import { TagSelfButton } from "@/components/events/TagSelfButton";
import { SECTION_ROLE_WINNER } from "@/lib/utils/roles";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function SectionBracketTabSelector({
  section,
  eventTitle,
  eventId,
}: {
  section: Section;
  eventTitle: string;
  eventId: string;
}) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [activeBracket, setActiveBracket] = useState(
    section?.brackets[0]?.id || ""
  );
  const [isUserWinner, setIsUserWinner] = useState(false);

  // Check if current user is winner of section
  useEffect(() => {
    const checkWinnerStatus = async () => {
      if (currentUserId && section?.id) {
        try {
          const { checkUserWinnerOfSection } = await import(
            "@/lib/server_actions/request_actions"
          );
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

  useEffect(() => {
    if (section?.brackets.length > 0) {
      setActiveBracket(section?.brackets[0]?.id || "");
    }
  }, [section]);

  // Aggregate styles from videos if section doesn't have direct styles
  const displayStyles = useMemo(() => {
    if (!section) return [];

    // First check if section has direct styles
    if (section.styles && section.styles.length > 0) {
      return section.styles;
    }

    // Otherwise, aggregate styles from all videos in the section
    const videoStyles = new Set<string>();

    // Get styles from direct section videos
    section.videos?.forEach((video) => {
      video.styles?.forEach((style) => videoStyles.add(style));
    });

    // Get styles from all bracket videos
    section.brackets?.forEach((bracket) => {
      bracket.videos?.forEach((video) => {
        video.styles?.forEach((style) => videoStyles.add(style));
      });
    });

    return Array.from(videoStyles);
  }, [section]);

  return (
    <div className="p-5">
      <Button
        asChild
        className="ml-5 mb-5 hover:bg-gray-300 hover:shadow-none hover:cursor-pointer shadow-md "
        variant="secondary"
      >
        <Link href={`/events/${eventId}`}>
          Back to {eventTitle}
        </Link>
      </Button>

      <div className="flex flex-col gap-1 items-center p-5">
        <h1 className="text-xl font-bold">{section?.title}</h1>
        {/* Display section winners */}
        {section?.winners && section.winners.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-lg font-bold">Winner:</span>
            {Array.from(
              new Map(
                section.winners
                  .filter((w) => w && w.username)
                  .map((w) => [w.username, w])
              ).values()
            ).map((winner) => (
              <Badge
                key={winner.username}
                variant="secondary"
                className="text-xs"
                asChild
              >
                {winner.username ? (
                  <Link href={`/profile/${winner.username}`}>
                    {winner.displayName}
                  </Link>
                ) : (
                  <span>{winner.displayName}</span>
                )}
              </Badge>
            ))}
          </div>
        )}
        {displayStyles.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-1">
            {displayStyles.map((style) => (
              <StyleBadge key={style} style={style} />
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500">{section?.description}</p>
        {currentUserId && section?.id && (
          <div className="mt-4">
            <TagSelfButton
              eventId={eventId}
              target="section"
              targetId={section.id}
              currentUserId={currentUserId}
              role={SECTION_ROLE_WINNER}
              isUserTagged={isUserWinner}
              showRemoveButton={true}
              buttonLabel="Tag Self as Winner"
              pendingLabel="Winner tag request pending"
              successLabel="Tagged as Winner"
            />
          </div>
        )}
      </div>
      {section?.hasBrackets ? (
        <div>
          <Tabs
            value={activeBracket}
            onValueChange={setActiveBracket}
            className="p-5 border-2 rounded-lg"
          >
            <TabsList className="flex flex-row gap-2 justify-center">
              {section?.brackets.map((bracket, index) => (
                <TabsTrigger key={index} value={bracket.id}>
                  {bracket.title}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={activeBracket}>
              <VideoGallery
                videos={
                  section?.brackets.find(
                    (bracket) => bracket.id === activeBracket
                  )?.videos || []
                }
                eventLink={`/events/${eventId}`}
                eventTitle={eventTitle}
                eventId={eventId}
                sectionTitle={section?.title}
                bracketTitle={
                  section?.brackets.find(
                    (bracket) => bracket.id === activeBracket
                  )?.title
                }
                sectionStyles={section?.styles}
                applyStylesToVideos={section?.applyStylesToVideos}
                currentUserId={currentUserId}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="p-5 border-2 rounded-lg">
          <VideoGallery
            videos={section?.videos}
            eventLink={`/events/${eventId}`}
            eventTitle={eventTitle}
            eventId={eventId}
            sectionTitle={section?.title}
            sectionStyles={section?.styles}
            applyStylesToVideos={section?.applyStylesToVideos}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}
