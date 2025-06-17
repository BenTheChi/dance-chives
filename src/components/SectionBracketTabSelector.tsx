"use client";

import { Section } from "@/types/event";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import VideoGallery from "./VideoGallery";

export default function SectionBracketTabSelector({
  sections,
  eventTitle,
}: {
  sections: Section[];
  eventTitle: string;
}) {
  const [activeSection, setActiveSection] = useState(0);
  const [activeBracket, setActiveBracket] = useState(
    sections[activeSection]?.brackets[0]?.id || ""
  );
  const router = useRouter();

  //Get params from url
  const path = usePathname();
  const eventId = path.split("/")[2];

  useEffect(() => {
    if (sections[activeSection]?.brackets.length > 0) {
      setActiveBracket(sections[activeSection]?.brackets[0]?.id || "");
    }
  }, [activeSection, sections]);

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
                sectionTitle={sections[activeSection]?.title}
                bracketTitle={
                  sections[activeSection]?.brackets.find(
                    (bracket) => bracket.id === activeBracket
                  )?.title
                }
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
            sectionTitle={sections[activeSection]?.title}
          />
        </div>
      )}
    </div>
  );
}
