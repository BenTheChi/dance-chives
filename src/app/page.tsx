import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppNavbar } from "@/components/AppNavbar";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { RecentlyAddedVideos } from "@/components/RecentlyAddedVideos";
import { getLatestEventVideos } from "@/db/queries/event";

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // Fetch latest videos from 6 events
  const latestVideos = await getLatestEventVideos();

  return (
    <div className="flex flex-col">
      <AppNavbar />
      <main className="flex-1 flex flex-col relative bg-charcoal/15 mb-10">
        {/* Pattern background that repeats for entire page */}
        <ParallaxBackground />

        {/* Content */}
        <div className="relative z-10">
          {/* Hero Section */}
          <section className="flex flex-col items-center px-8 gap-10 py-20 sm:py-32">
            <div className="flex flex-col items-center gap-10 bg-charcoal p-6 border-4 border-primary-light rounded-sm">
              <Image
                src="/AltLogo_Color_onDark-cropped.svg"
                alt="Dance Chives Logo"
                width={500}
                height={500}
              />
              <h2 className="sm:!text-[40px] max-w-2xl text-center tracking-wider">
                The free community ar
                <span className="text-primary-light">chive</span> for street
                dance events
              </h2>
            </div>
            <Link href="/signup">
              <Button
                size="xl"
                className="font-rubik-mono-one !text-2xl text-charcoal"
              >
                Get Started
              </Button>
            </Link>
          </section>

          <div className="flex flex-col items-center gap-20 px-2">
            {/* Events CTA */}
            <section className="max-w-6xl mx-auto bg-primary rounded-sm py-8 px-2 sm:px-4 border-4 border-primary-light w-full">
              <h2 className="sm:!text-3xl text-center mb-8">
                Tired of bouncing between Youtube, Facebook, and Instagram?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-video bg-charcoal border-4 border-primary-light shadow-[6px_6px_0_0_var(--primary-color-light)] flex items-center justify-center">
                    <span className="text-primary-light text-lg font-bold">
                      Screenshot Placeholder
                    </span>
                  </div>
                  <p className="text-center text-lg font-medium">
                    Watch all videos for an event in a row.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-video bg-charcoal border-4 border-primary-light shadow-[6px_6px_0_0_var(--primary-color-light)] flex items-center justify-center">
                    <span className="text-primary-light text-lg font-bold">
                      Screenshot Placeholder
                    </span>
                  </div>
                  <p className="text-center text-lg font-medium">
                    Learn more about the event itself.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-video bg-charcoal border-4 border-primary-light shadow-[6px_6px_0_0_var(--primary-color-light)] flex items-center justify-center">
                    <span className="text-primary-light text-lg font-bold">
                      Screenshot Placeholder
                    </span>
                  </div>
                  <p className="text-center text-lg font-medium">
                    Discover dancers and follow their journey.
                  </p>
                </div>
              </div>
              <Link href="/events">
                <Button
                  size="xl"
                  className="font-rubik-mono-one !text-2xl text-charcoal mx-auto block mt-6 !bg-accent-blue"
                >
                  Discover Events
                </Button>
              </Link>
            </section>

            {/* Calendar CTA */}
            <section className="max-w-6xl mx-auto bg-primary rounded-sm p-4 border-4 border-primary-light w-full">
              <h2 className="sm:!text-3xl text-center mb-8">
                Never miss an event again with the community calendar
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-video bg-charcoal border-4 border-secondary-light shadow-[6px_6px_0_0_var(--secondary-color-light)] flex items-center justify-center">
                    <span className="text-secondary-light text-lg font-bold">
                      Screenshot Placeholder
                    </span>
                  </div>
                  <p className="text-center text-lg font-medium">
                    See all events for any city. Perfect for traveling!
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-video bg-charcoal border-4 border-secondary-light shadow-[6px_6px_0_0_var(--secondary-color-light)] flex items-center justify-center">
                    <span className="text-secondary-light text-lg font-bold">
                      Screenshot Placeholder
                    </span>
                  </div>
                  <p className="text-center text-lg font-medium">
                    Save events so they show up on your personal calendar
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Link href="/calendar">
                  <Button
                    size="xl"
                    variant="secondary"
                    className="font-rubik-mono-one !text-2xl text-charcoal"
                  >
                    View Calendar
                  </Button>
                </Link>
              </div>
            </section>

            {/* Community CTA */}
            <section className="max-w-6xl mx-auto bg-primary rounded-sm p-4 border-4 border-primary-light w-full">
              <h2 className="sm:!text-3xl text-center mb-8">
                A structured public record of event and battle roles
              </h2>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-video bg-charcoal border-4 border-accent-purple shadow-[6px_6px_0_0_var(--accent-color-purple)] flex items-center justify-center">
                    <span className="text-accent-purple text-lg font-bold">
                      Screenshot Placeholder
                    </span>
                  </div>
                  <p className="text-center text-lg font-medium">
                    Tag yourself as a dancer, organizer, dj, and more to build
                    your dance community profile
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-video bg-charcoal border-4 border-accent-purple shadow-[6px_6px_0_0_var(--accent-color-purple)] flex items-center justify-center">
                    <span className="text-accent-purple text-lg font-bold">
                      Screenshot Placeholder
                    </span>
                  </div>
                  <p className="text-center text-lg font-medium">
                    Browse profiles from dancers in your community and around
                    the world
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <Link href="/profiles">
                  <Button
                    size="xl"
                    className="font-rubik-mono-one !text-2xl text-charcoal !bg-accent-blue"
                  >
                    Explore Community
                  </Button>
                </Link>
              </div>
            </section>

            {/* Latest Videos */}
            <section className="max-w-6xl mx-auto w-full bg-secondary-dark rounded-sm p-4 border-4 border-secondary-light">
              <h2 className="!text-4xl sm:!text-5xl text-center mb-12">
                Recently Added
              </h2>
              {latestVideos.length > 0 ? (
                <RecentlyAddedVideos videos={latestVideos} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No videos available yet.
                  </p>
                </div>
              )}
            </section>

            {/* Final CTA */}
            <section className="w-full mx-auto text-center">
              <Link href="/signup">
                <Button
                  size="xl"
                  className="font-rubik-mono-one !text-2xl text-charcoal"
                >
                  Sign Up Free
                </Button>
              </Link>
            </section>

            {/* Contribute Section */}
            <section
              id="contribute"
              className="max-w-6xl mx-auto bg-secondary-dark rounded-sm p-4 border-4 border-primary-light w-full"
            >
              <div className="py-6">
                <h2 className="mb-12 !text-4xl sm:!text-5xl text-center">
                  Help shape the future of Dance Chives
                </h2>
                <div className="flex flex-col md:flex-row justify-center gap-12 md:gap-20">
                  {/* Discord Section */}
                  <div className="space-y-6 max-w-md">
                    <h3 className="!text-2xl !font-bold">Join the Discord</h3>
                    <a
                      href="https://discord.gg/HfYg868Ay4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-[#5865F2] hover:bg-primary-light transition-colors duration-75 h-40 border-4 border-primary-light shadow-[6px_6px_0_0_var(--primary-color-light)] flex items-center justify-center hover:shadow-[8px_8px_0_0_var(--primary-color-light)] hover:-translate-y-1 transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="80"
                        height="80"
                        fill="white"
                        viewBox="0 0 16 16"
                        className="group-hover:fill-charcoal transition-colors"
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
                    <h3 className="!text-2xl !font-bold">Donate</h3>
                    <div className="bg-charcoal h-40 border-4 border-primary-light shadow-[6px_6px_0_0_var(--primary-color-light)] flex items-center justify-center">
                      <p className="text-primary-light text-lg font-bold">
                        Donate Button Placeholder
                      </p>
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
          </div>
        </div>
      </main>
    </div>
  );
}
