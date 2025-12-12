"use client";

import { Section } from "@/types/event";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import VideoGallery from "./VideoGallery";

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

  useEffect(() => {
    if (section?.brackets.length > 0) {
      setActiveBracket(section?.brackets[0]?.id || "");
    }
  }, [section]);

  return (
    <div className="w-full" style={{ boxSizing: "content-box" }}>
      {section?.hasBrackets ? (
        <div className="rounded-lg" style={{ boxSizing: "content-box" }}>
          <Tabs
            value={activeBracket}
            onValueChange={setActiveBracket}
            className="w-full"
          >
            <TabsList className="flex flex-row gap-2 justify-center mb-4">
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
        <div className="rounded-lg" style={{ boxSizing: "content-box" }}>
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
