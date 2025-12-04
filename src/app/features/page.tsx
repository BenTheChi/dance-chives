"use client";

import {
  HeroSection,
  SectionContainer,
  SectionHeader,
  FeatureCard,
  FeaturesGrid,
  CTAButton,
} from "@/components/landing";

export default function FeaturesPage() {
  return (
    <div className="w-full bg-[#f5f5f5] min-h-screen">
      <HeroSection
        backgroundImage="/features/banner2.jpg"
        title={
          <>
            Built for the community. <br />
            By the community.
          </>
        }
        subtitle="The complete platform for organizing, sharing, and preserving dance culture"
        overlayOpacity={50}
        height="h-[500px] md:h-[600px]"
        backLink={{ href: "/", label: "Back" }}
      />

      {/* Organize Section */}
      <SectionContainer
        id="organize"
        bgColor="bg-[#c4ffd9]"
        padding="py-10 md:py-16 px-6"
      >
        <div className="max-w-2xl lg:max-w-6xl mx-auto">
          <SectionHeader title="ORGANIZE" subtitle="Event data and media" />

          <FeaturesGrid columns={2}>
            <FeatureCard
              title="From workshops to battles—classify every moment"
              description="Structure your events with 8+ event types (Battles, Competitions, Classes, Workshops, Sessions, Parties, Festivals, Performances) and 9 specialized section types (Battle, Tournament, Competition, Performance, Showcase, Class, Session, or Mixed) ensure every part of your event is properly categorized and easy to find."
            />
            <FeatureCard
              title="Videos organized by purpose, not just uploaded in bulk"
              description="Unlike generic media dumps, Dance Chives organizes videos within sections (battles, showcases, classes) and brackets. Each video knows its context—what section it belongs to, who's tagged, what styles are featured—making your archive searchable and meaningful years later."
            />
            <FeatureCard
              title="Posters and photos that complete the picture"
              description="Add event and section posters for visual impact, plus up to 10 gallery photos with captions. Showcase the venue, crowd, and in-between moments that complement your video archive and tell your event's complete story."
            />
            <FeatureCard
              title="One page, two purposes—promote now, archive forever"
              description="Create your event page to promote upcoming battles and workshops, then return after the event to add videos, tag winners, and build a permanent archive. The same structured page evolves from promotional flyer to historical record."
            />
          </FeaturesGrid>

          <div className="mt-16 text-center">
            <CTAButton onClick={() => (window.location.href = "#newsletter")}>
              Join Early Access
            </CTAButton>
          </div>
        </div>
      </SectionContainer>

      {/* Connect Section */}
      <SectionContainer id="connect" padding="py-10 md:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="CONNECT"
            subtitle="Dancers to strengthen community"
          />

          <FeaturesGrid columns={3}>
            <FeatureCard
              title="Tag yourself, build your dance resume"
              description="Dancers can tag themselves in videos as competitors, winners, choreographers, or teachers. Your profile automatically showcases your battles, wins, and contributions—building your digital dance portfolio. Give credit where credit's due."
              cardBgColor="bg-[#c4ffd9]"
              cardBorderColor="border-black"
            />
            <FeatureCard
              title="Tag event organizers, DJs, judges, teachers, and more"
              description="Dance Chives ensures everyone who contributes to an event gets recognized with role-based tagging."
              cardBgColor="bg-[#c4ffd9]"
              cardBorderColor="border-black"
            />
            <FeatureCard
              title="Connect dancers across the world and through time"
              description="Find dancers you've met before, track their growth, and strengthen community connections."
              cardBgColor="bg-[#c4ffd9]"
              cardBorderColor="border-black"
            />
          </FeaturesGrid>

          <div className="mt-16 text-center">
            <CTAButton onClick={() => (window.location.href = "#newsletter")}>
              Join Early Access
            </CTAButton>
          </div>
        </div>
      </SectionContainer>

      {/* Share Section */}
      <SectionContainer
        id="share"
        bgColor="bg-[#c4ffd9]"
        padding="py-10 md:py-16 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="SHARE" subtitle="Your events on the calendar" />

          <FeaturesGrid columns={3}>
            <FeatureCard
              title="Your city's dance scene all in one calendar"
              description="City-based calendars display every dance event happening in your area. No more scattered group chats, random IG feeds, or missed announcements. See what's happening at a glance."
            />
            <FeatureCard
              title="Filter by style, type, or both—find your vibe"
              description="Looking for breaking battles? House workshops? Popping open sessions? Filter the calendar by dance style and event type to surface exactly what you're interested in, skipping the rest."
            />
            <FeatureCard
              title="Customize your dance schedule"
              description="Save events you want to pop up on your own calendar. Go back to saved events in the past and reminisce the good times."
            />
          </FeaturesGrid>

          <div className="mt-16 text-center">
            <CTAButton
              variant="highlight"
              onClick={() => (window.location.href = "#newsletter")}
            >
              Join Early Access
            </CTAButton>
          </div>
        </div>
      </SectionContainer>

      {/* Battle Section */}
      <SectionContainer
        id="battle"
        bgColor="bg-[#3a3a3a]"
        padding="py-10 md:py-16 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="BATTLE"
            subtitle="At events and relive the moment here"
            titleColor="text-[#c4ffd9]"
            subtitleColor="text-[#f5f5f5]"
          />

          <FeaturesGrid columns={3}>
            <FeatureCard
              title="Brackets that track the competition progression structure"
              description="Battle and tournament sections come with multi-round brackets. Whether it's 'Cypher prelims', 'Top 8', or 'Dance group 7A' use custom labels to match the exact structure of your event."
              headerBgColor="bg-[#c4ffd9]"
              headerTextColor="text-[#2a2a2a]"
              cardBgColor="bg-[#f5f5f5]"
              cardBorderColor="border-black"
            />
            <FeatureCard
              title="Tag winners, celebrate champions"
              description="Mark battle winners at the video and section level. Winners get recognition on their profiles, and their victories become part of their permanent dance record."
              headerBgColor="bg-[#c4ffd9]"
              headerTextColor="text-[#2a2a2a]"
              cardBgColor="bg-[#f5f5f5]"
              cardBorderColor="border-black"
            />
            <FeatureCard
              title="Relive the battles, study the competition"
              description="Battle videos are preserved with full context—who competed, who won, what styles were represented. Review your round, track competitors, and prepare for the next challenge."
              headerBgColor="bg-[#c4ffd9]"
              headerTextColor="text-[#2a2a2a]"
              cardBgColor="bg-[#f5f5f5]"
              cardBorderColor="border-black"
            />
          </FeaturesGrid>

          <div className="mt-16 text-center">
            <CTAButton onClick={() => (window.location.href = "#newsletter")}>
              Join Early Access
            </CTAButton>
          </div>
        </div>
      </SectionContainer>

      {/* Newsletter Section */}
      <SectionContainer bgColor="bg-[#c4ffd9]" padding="py-12" id="newsletter">
        <div className="ml-embedded" data-form="op8sua"></div>
      </SectionContainer>
    </div>
  );
}
