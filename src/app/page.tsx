import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { getLatestBattleSections } from "@/db/queries/event";
import { getUpcomingEventCards } from "@/db/queries/event-cards";
import { ReportButton } from "@/components/report/ReportButton";
import { EventCard } from "@/components/EventCard";
import {
  Info,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Tv,
  Plus,
} from "lucide-react";

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // Fetch latest battle sections from 6 events
  const latestBattleSections = await getLatestBattleSections();

  // Fetch upcoming events
  const upcomingEvents = await getUpcomingEventCards(4);

  return (
    <div className="flex flex-col">
      <main className="flex-1 flex flex-col bg-charcoal/15 mb-10">
        {/* Content */}
        <div>
          {/* Hero Section */}
          <section className="flex flex-col items-center px-8 gap-10 py-20 sm:py-32">
            <div className="flex flex-col items-center gap-10 bg-charcoal p-6 border-4 border-primary-light rounded-sm">
              <div className="flex flex-col items-center gap-4">
                <h1>
                  <Image
                    src="/AltLogo_Color_onDark-cropped.svg"
                    alt="Dance Chives. The free community archive for street dance events and battle videos."
                    width={500}
                    height={500}
                  />
                </h1>
                <Link
                  href="#open-beta"
                  className="text-center bg-white text-charcoal px-4 py-2 rounded-sm text-4xl font-rubik-mono-one w-full"
                >
                  Open Beta<sup className="text-2xl">*</sup>
                </Link>
              </div>
              <h2 className="sm:!text-[40px] max-w-2xl text-center tracking-wider">
                The free community ar
                <span className="text-primary-light !text-[30px] sm:!text-[40px]">
                  chive
                </span>{" "}
                for street dance events
              </h2>
            </div>
          </section>

          <div className="flex flex-col items-center gap-20">
            {/* CTA - Changes based on login status */}
            {/* <HomePageCTA variant="primary" /> */}
            {/* <section className="max-w-6xl mx-auto bg-primary rounded-sm py-8 px-2 sm:px-4 border-4 border-primary-light w-full">
              <h2 className="sm:!text-3xl !font-extrabold text-center mb-8">
                Tired of bouncing between Youtube, Facebook, and Instagram?
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src="/screenshots/videos.png"
                    alt="Video Gallery Screenshot"
                    width={500}
                    height={500}
                    className="border-4 border-primary-light rounded-sm"
                  />
                  <p className="text-center !text-xl">
                    Watch all videos for an event in a row
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src="/screenshots/event-details.png"
                    alt="Event Details Screenshot"
                    width={500}
                    height={500}
                    className="border-4 border-primary-light rounded-sm"
                  />
                  <p className="text-center !text-xl">
                    Learn more about the event itself
                  </p>
                </div>
              </div>
              <MaintenanceLink href="/events">
                <Button
                  size="xl"
                  className="font-rubik-mono-one text-base sm:text-xl md:!text-2xl text-charcoal mx-auto block mt-6 !bg-accent-blue px-4 sm:px-6 md:px-10"
                >
                  Discover Events
                </Button>
              </MaintenanceLink>
            </section>

            <section className="max-w-6xl mx-auto bg-secondary-dark rounded-sm py-8 px-2 sm:px-4 border-4 border-secondary-light w-full">
              <h2 className="sm:!text-3xl !font-extrabold text-center mb-8">
                Never miss an event again with the community calendar
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src="/screenshots/calendar-event.png"
                    alt="Calendar Event Screenshot"
                    width={500}
                    height={500}
                    className="border-4 border-secondary-light rounded-sm"
                  />
                  <p className="text-center !text-xl">
                    See all events for any city. Perfect for traveling!
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src="/screenshots/saved-event.png"
                    alt="Saved Event Screenshot"
                    width={500}
                    height={500}
                    className="border-4 border-secondary-light rounded-sm"
                  />
                  <p className="text-center !text-xl">
                    Save events so they show up on your personal calendar
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <MaintenanceLink href="/calendar">
                  <Button
                    size="xl"
                    className="font-rubik-mono-one text-base sm:text-xl md:!text-2xl text-charcoal !bg-accent-blue px-4 sm:px-6 md:px-10"
                  >
                    View Calendar
                  </Button>
                </MaintenanceLink>
              </div>
            </section>

            <section className="max-w-6xl mx-auto bg-primary rounded-sm py-8 px-2 sm:px-4 border-4 border-primary-light w-full">
              <h2 className="sm:!text-3xl !font-extrabold text-center mb-8">
                A structured public record of event and battle roles
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src="/screenshots/profile-tag.png"
                    alt="Profile Tag Screenshot"
                    width={500}
                    height={500}
                    className="border-4 border-primary-light rounded-sm"
                  />
                  <p className="text-center !text-xl">
                    Tag yourself as a dancer, organizer, dj, and more to build
                    your dance community profile
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src="/screenshots/profile.png"
                    alt="Profile Screenshot"
                    width={500}
                    height={500}
                    className="border-4 border-primary-light rounded-sm"
                  />
                  <p className="text-center !text-xl">
                    Browse profiles from dancers in your community and around
                    the world
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <MaintenanceLink href="/profiles">
                  <Button
                    size="xl"
                    className="font-rubik-mono-one text-base sm:text-xl md:!text-2xl text-charcoal !bg-accent-blue px-4 sm:px-6 md:px-10"
                  >
                    Explore Community
                  </Button>
                </MaintenanceLink>
              </div>
            </section> */}

            {/* Battle TV Promotion */}
            <section className="max-w-6xl mx-auto w-full bg-primary rounded-sm py-12 px-4 sm:px-8 border-4 border-primary-light">
              <div className="flex flex-col items-center gap-10">
                <div className="text-center space-y-4">
                  <h2
                    className="flex items-center gap-6 mb-4"
                    style={{ wordSpacing: -25 }}
                  >
                    <div className="text-3xl sm:text-5xl hidden sm:block">
                      📺
                    </div>
                    <Link
                      href="/watch"
                      className="!text-5xl md:!text-6xl !font-rubik-mono-one text-accent-red-orange text-outline opacity hover:underline decoration-accent-red-orange transition-all tracking-wide"
                    >
                      Battle TV
                    </Link>
                    <div className="text-3xl sm:text-5xl hidden sm:block">
                      📺
                    </div>
                  </h2>
                </div>

                {/* Feature Bullet Points */}
                <div className="flex flex-col items-center gap-15 max-w-3xl">
                  <div className="flex flex-col items-center gap-2">
                    <h3 className="mb-2 !font-rubik-mono-one !text-3xl text-outline-thin">
                      React
                    </h3>
                    {/* Reactions Feature */}
                    <div className="flex flex-col items-center gap-4 p-6 bg-secondary-dark/50 rounded-sm border-2 border-primary-light hover:bg-secondary-dark/70 transition-colors">
                      <div className="flex gap-8 text-5xl sm:text-6xl justify-center items-center">
                        <span className="transition-transform duration-300 hover:scale-150 cursor-default inline-block !text-4xl">
                          🔥
                        </span>
                        <span className="transition-transform duration-300 hover:scale-150 cursor-default inline-block !text-4xl">
                          👏
                        </span>
                        <span className="transition-transform duration-300 hover:scale-150 cursor-default inline-block !text-4xl">
                          😮
                        </span>
                        <span className="transition-transform duration-300 hover:scale-150 cursor-default inline-block !text-4xl">
                          😂
                        </span>
                      </div>
                      <div className="flex-1">
                        <p>
                          Drop your reactions on <b>exact timestamps</b> in the
                          video and see how the community felt move by move
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 w-full">
                    <h3 className="mb-2 !font-rubik-mono-one !text-3xl text-outline-thin">
                      Browse
                    </h3>
                    {/* Navigation Feature */}
                    <div className="flex flex-col items-center gap-4 p-6 bg-secondary-dark/50 rounded-sm border-2 border-primary-light hover:bg-secondary-dark/70 transition-colors w-full">
                      <div className="flex items-center justify-center gap-2 min-w-[120px]">
                        <div className="flex items-center gap-6">
                          <ArrowLeft
                            size={40}
                            className="text-orange-400 transition-transform duration-300 hover:scale-150 cursor-default"
                            strokeWidth={3}
                          />
                          <ArrowRight
                            size={40}
                            className="text-orange-400 transition-transform duration-300 hover:scale-150 cursor-default"
                            strokeWidth={3}
                          />
                          <ArrowUp
                            size={40}
                            className="text-yellow-400 transition-transform duration-300 hover:scale-150 cursor-default"
                            strokeWidth={3}
                          />
                          <ArrowDown
                            size={40}
                            className="text-yellow-400 transition-transform duration-300 hover:scale-150 cursor-default"
                            strokeWidth={3}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p>
                          Navigate <b>videos</b>, <b>sections</b>, and{" "}
                          <b>battles</b> across events in a way that makes
                          sense. No more confusing IG and YT algorithms.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Screen Optimization Feature */}
                  <div className="flex flex-col items-center gap-2 w-full">
                    <h3 className="mb-2 !font-rubik-mono-one !text-3xl text-outline-thin">
                      All Screens
                    </h3>
                    <div className="flex flex-col items-center gap-4 p-6 bg-secondary-dark/50 rounded-sm border-2 border-primary-light hover:bg-secondary-dark/70 transition-colors w-full">
                      <div className="flex items-center justify-center gap-2 min-w-[120px]">
                        <div className="flex flex-row items-center justify-center gap-6 flex-wrap">
                          {/* Mobile Portrait */}
                          <div className="w-16 h-28 bg-accent-blue border-2 border-primary-light rounded-sm flex items-center justify-center shadow-hover">
                            <span className="text-charcoal !font-semibold rotate-90 whitespace-nowrap">
                              Portrait
                            </span>
                          </div>
                          {/* Mobile Landscape */}
                          <div className="w-28 h-16 bg-accent-blue border-2 border-primary-light rounded-sm flex items-center justify-center shadow-hover">
                            <span className="text-charcoal !font-semibold whitespace-nowrap">
                              Landscape
                            </span>
                          </div>
                          {/* Desktop */}
                          <div className="w-36 h-24 bg-accent-purple border-2 border-primary-light rounded-sm flex items-center justify-center shadow-hover">
                            <span className="text-charcoal !font-semibold whitespace-nowrap">
                              Desktop
                            </span>
                          </div>
                          {/* Fullscreen */}
                          <div className="w-60 h-30 bg-accent-purple border-2 border-primary-light rounded-sm flex items-center justify-center shadow-hover">
                            <span className="text-charcoal !font-semibold whitespace-nowrap">
                              Fullscreen
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p>
                          Optimized for <b>every screen</b>. Whether you're on
                          the go or at home, you can watch event footage from
                          <b> any browser</b> on <b>any device.</b>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details Feature */}
                  <div className="flex flex-col items-center gap-2 w-full">
                    <h3 className="mb-2 !font-rubik-mono-one !text-3xl text-outline-thin">
                      Deep Dive
                    </h3>
                    <div className="flex flex-col items-center gap-4 p-6 bg-secondary-dark/50 rounded-sm border-2 border-primary-light hover:bg-secondary-dark/70 transition-colors">
                      <div className="flex items-center justify-center gap-2 min-w-[120px]">
                        <div className="w-12 h-12 rounded-full bg-fog-white border-2 border-black flex items-center justify-center shadow-hover">
                          <Info className="w-6 h-6 text-charcoal" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p>
                          Ever watch a video and wish you could learn more?
                          Click on{" "}
                          <Info className="inline" size={21} strokeWidth={3} />{" "}
                          to quickly find the details about the
                          <b> event and dancers.</b> Then let your curiosity
                          guide you through easy
                          <b> navigation links.</b>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tag Feature */}
                  <div className="flex flex-col items-center gap-2 w-full">
                    <h3 className="mb-2 !font-rubik-mono-one !text-3xl text-outline-thin">
                      Tag People
                    </h3>
                    <div className="flex flex-col items-center gap-4 p-6 bg-secondary-dark/50 rounded-sm border-2 border-primary-light hover:bg-secondary-dark/70 transition-colors">
                      <div className="flex items-center justify-center gap-2 min-w-[120px]">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-yellow text-black border-2 border-charcoal transition-shadow duration-150 hover:glow hover:scale-130 transition-transform duration-150 cursor-default">
                          <Plus className="w-7 h-7 stroke-[3]" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p>
                          Tag your <b> friends and other community members</b>{" "}
                          as dancers, winners, and more to help build our
                          history and give credit where it's due.
                          <br />
                          <br />
                          <b>See yourself? Tag yourself!</b>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Link href="/watch">
                  <Button
                    size="xl"
                    className="font-rubik-mono-one text-base sm:text-xl md:!text-2xl text-charcoal !bg-accent-blue px-6 sm:px-8 md:px-12 mt-4 hover:scale-105 transition-transform shadow-hover"
                  >
                    Watch Battles Now
                  </Button>
                </Link>
              </div>
            </section>

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <section className="max-w-6xl mx-auto w-full bg-secondary-dark rounded-sm py-8 px-4 border-4 border-secondary-light">
                <h2 className="!text-4xl sm:!text-5xl text-center mb-12 !font-rubik-mono-one text-outline">
                  Upcoming Events
                </h2>
                <div className="flex flex-wrap justify-center gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} {...event} />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Battles */}
            <section className="max-w-6xl mx-auto w-full bg-secondary-dark rounded-sm py-8 px-4 border-4 border-secondary-light">
              <h2 className="mb-12 !font-rubik-mono-one !text-4xl sm:!text-5xl text-outline text-center">
                Recently Added Battles
              </h2>
              {latestBattleSections.length > 0 ? (
                <div className="sections-grid">
                  {latestBattleSections.map(
                    ({ section, eventId, eventTitle, city }) => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        eventId={eventId}
                        eventTitle={eventTitle}
                        showEventTitle={true}
                        city={city}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No battle sections available yet.
                  </p>
                </div>
              )}
            </section>

            {/* Contribute Section */}
            <section
              id="contribute"
              className="max-w-6xl mx-auto bg-primary rounded-sm p-4 border-4 border-primary-light w-full"
            >
              <div className="py-6">
                <h2 className="mb-12 !text-4xl sm:!text-5xl text-center !font-rubik-mono-one text-outline">
                  Contribute
                </h2>
                <div className="flex flex-col md:flex-row justify-center gap-12 md:gap-20">
                  {/* Discord Section */}
                  <div className="space-y-6 max-w-md">
                    <h3 className="!text-2xl !font-bold text-center">
                      Join the Discord
                    </h3>
                    <a
                      href="https://discord.gg/HfYg868Ay4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-[#5865F2] card h-40 flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="80"
                        height="80"
                        fill="white"
                        viewBox="0 0 16 16"
                        className="group-hover:fill-primary-light transition-colors"
                      >
                        <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
                      </svg>
                    </a>
                    <div className="space-y-3">
                      <p>
                        Become an open source contributor or early access
                        tester. Help in any form big or small is always welcome.
                        Give feedback on the platform and connect with the
                        creators of Dance Chives.
                      </p>
                    </div>
                  </div>

                  {/* Donate Section */}
                  <div className="space-y-6 max-w-md">
                    <h3 className="!text-2xl !font-bold text-center">Donate</h3>
                    <div className="flex justify-center gap-6">
                      <Link
                        href="https://buy.stripe.com/9B63cw9Bg62s0BB5ZN4Ja00"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-24 h-24 rounded-full flex items-center justify-center bg-accent-purple text-charcoal font-bold text-xl transition-colors cursor-pointer hover:scale-110 border-4 border-primary-light"
                      >
                        $5
                      </Link>
                      <Link
                        href="https://buy.stripe.com/bJe14o7t81Mc843ewj4Ja01"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-24 h-24 rounded-full flex items-center justify-center bg-accent-yellow text-charcoal font-bold text-xl transition-colors cursor-pointer hover:scale-110 border-4 border-primary-light"
                      >
                        $15
                      </Link>
                      <Link
                        href="https://buy.stripe.com/28EbJ2dRwaiI3NN1Jx4Ja02"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-24 rounded-full flex items-center justify-center bg-accent-blue text-charcoal font-bold text-xl transition-colors cursor-pointer hover:scale-110 border-4 border-primary-light"
                      >
                        $30
                      </Link>
                    </div>
                    <div className="space-y-3">
                      <p>
                        A lot of time and effort has been put into Dance Chives.
                        Every dollar in these early stages goes directly back
                        into development and helping to grow the community.
                        Please consider donating to support the project.
                      </p>
                      <p>
                        Dance Chives is a for-profit organization. Donations are
                        not tax-deductible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              className="max-w-6xl mx-auto w-full bg-primary rounded-sm p-4 border-4 border-primary-light"
              id="open-beta"
            >
              <h2 className="!text-4xl sm:!text-5xl text-center mb-6 !font-rubik-mono-one text-outline">
                Open Beta
              </h2>
              <p className="!text-lg px-10">
                Dance Chives is currently in open beta. This means that the
                platform is still under development with bug fixes and new
                features being added regularly.
                <br /> <br /> Please use the report button (
                <ReportButton /> in the navbar, 'Report' in the footer) to
                report any issues or provide feedback for the platform. <br />
                <br /> We welcome all feedback and will use it to improve the
                platform. Thank you for your support!
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
