"use client";

import { Section } from "@/types/event";
import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { StyleBadge } from "./ui/style-badge";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import VideoGallery from "./VideoGallery";

export default function SectionBracketTabSelector({
  sections,
  eventTitle,
  eventId,
}: {
  sections: Section[];
  eventTitle: string;
  eventId: string;
}) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [activeSection, setActiveSection] = useState(0);
  const [activeBracket, setActiveBracket] = useState(
    sections[activeSection]?.brackets[0]?.id || ""
  );
  const router = useRouter();

  useEffect(() => {
    if (sections[activeSection]?.brackets.length > 0) {
      setActiveBracket(sections[activeSection]?.brackets[0]?.id || "");
    }
  }, [activeSection, sections]);

  // Aggregate styles from videos if section doesn't have direct styles
  const displayStyles = useMemo(() => {
    const activeSectionData = sections[activeSection];
    if (!activeSectionData) return [];

    // First check if section has direct styles
    if (activeSectionData.styles && activeSectionData.styles.length > 0) {
      return activeSectionData.styles;
    }

    // Otherwise, aggregate styles from all videos in the section
    const videoStyles = new Set<string>();

    // Get styles from direct section videos
    activeSectionData.videos?.forEach((video) => {
      video.styles?.forEach((style) => videoStyles.add(style));
    });

    // Get styles from all bracket videos
    activeSectionData.brackets?.forEach((bracket) => {
      bracket.videos?.forEach((video) => {
        video.styles?.forEach((style) => videoStyles.add(style));
      });
    });

    return Array.from(videoStyles);
  }, [sections, activeSection]);

  return (
    <div className="p-5">
      <Button
        onClick={() => router.push(`/event/${eventId}`)}
        className="ml-5 mb-5 hover:bg-gray-300 hover:shadow-none hover:cursor-pointer shadow-md "
        variant="secondary"
      >
        Back to {eventTitle}
      </Button>

      <nav className="flex gap-5 justify-center">
        {sections.map((section, index) => (
          <div key={section.id} className="relative group">
            <Button
              type="button"
              variant={activeSection === index ? "default" : "outline"}
              onClick={() => setActiveSection(index)}
            >
              {section.title}
            </Button>
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-1 items-center p-5">
        <h1 className="text-xl font-bold">{sections[activeSection]?.title}</h1>
        {displayStyles.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-1">
            {displayStyles.map((style) => (
              <StyleBadge key={style} style={style} />
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500">
          {sections[activeSection]?.description}
        </p>
      </div>
      {sections[activeSection]?.hasBrackets ? (
        <div>
          <Tabs
            value={activeBracket}
            onValueChange={setActiveBracket}
            className="p-5 border-2 rounded-lg"
          >
            <TabsList className="flex flex-row gap-2 justify-center">
              {sections[activeSection]?.brackets.map((bracket, index) => (
                <TabsTrigger key={index} value={bracket.id}>
                  {bracket.title}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={activeBracket}>
              <VideoGallery
                videos={
                  sections[activeSection]?.brackets.find(
                    (bracket) => bracket.id === activeBracket
                  )?.videos || []
                }
                eventLink={`/event/${eventId}`}
                eventTitle={eventTitle}
                eventId={eventId}
                sectionTitle={sections[activeSection]?.title}
                bracketTitle={
                  sections[activeSection]?.brackets.find(
                    (bracket) => bracket.id === activeBracket
                  )?.title
                }
                sectionStyles={sections[activeSection]?.styles}
                applyStylesToVideos={
                  sections[activeSection]?.applyStylesToVideos
                }
                currentUserId={currentUserId}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="p-5 border-2 rounded-lg">
          <VideoGallery
            videos={sections[activeSection]?.videos}
            eventLink={`/event/${eventId}`}
            eventTitle={eventTitle}
            eventId={eventId}
            sectionTitle={sections[activeSection]?.title}
            sectionStyles={sections[activeSection]?.styles}
            applyStylesToVideos={sections[activeSection]?.applyStylesToVideos}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}
