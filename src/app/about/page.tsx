export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
        About Dance Chives
      </h1>
      <main className="flex-1 flex flex-col relative mb-10">
        {/* Content */}
        <div className="relative z-10">
          <div className="flex flex-col items-center gap-20 px-2 py-20">
            {/* Mission Statement Section */}
            <section className="max-w-6xl mx-auto bg-primary rounded-sm py-8 px-4 sm:px-8 border-4 border-primary-light w-full">
              <div className="space-y-8 text-base leading-relaxed">
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-white">
                    Our Mission
                  </h2>
                  <p className="text-white/95">
                    Dance Chives is a free community archive designed to
                    collect, display, and track street dance event data. Our
                    mission is to unify all metadata, media, and social
                    connections through a single, accessible platform. We
                    believe that the street and club dance community deserves a
                    structured, searchable archive that properly recognizes the
                    talented dancers, event hosts, and creators who make this
                    culture thrive.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 text-white">
                    Comparing Platforms
                  </h2>
                  <div className="space-y-4 text-white/95">
                    <p>
                      <strong className="text-white">Bboy.org</strong> was great
                      for connecting the global community but more focused on
                      threads of conversations.
                    </p>
                    <p>
                      <strong className="text-white">Youtube</strong> has always
                      been and will continue to be the best place to watch
                      entire battles, but it does not connect the community nor
                      is it good for event organization.
                    </p>
                    <p>
                      <strong className="text-white">Instagram</strong> is great
                      for tagging, building followers, and sharing short form
                      videos. It also lacks event organization and cannot
                      support long form videos.
                    </p>
                    <p>
                      <strong className="text-white">Facebook</strong> is great
                      for organizing events but it is not a great place to
                      search for battles or find events anymore.
                    </p>
                    <p className="pt-2">
                      <strong className="text-white">Dance Chives</strong>{" "}
                      leverages the features of each to create a unified
                      platform that specifically caters to the needs of the
                      street dance community.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 text-white">
                    A Community Index
                  </h2>
                  <div className="space-y-4 text-white/95">
                    <p>
                      Dance Chives serves as a comprehensive community index for
                      the street dance world. Through the collective grassroots
                      efforts of dancers and organizers, thousands of battles
                      and events take place across the globe each year,
                      generating extensive footage and documentation. While most
                      events are promoted and shared on social media platforms
                      like Facebook, Instagram, and YouTube, these platforms
                      lack the structure to systematically organize dance events
                      and their metadata in an accessible way.
                    </p>
                    <p>
                      That&apos;s where Dance Chives comes in. We provide a
                      structured public record of event and battle roles,
                      allowing dancers to tag themselves as organizers, DJs,
                      MCs, participants, winners, and more. This creates a
                      comprehensive archive that connects the community and
                      ensures proper recognition for everyone involved in the
                      dance scene.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Open Source Section */}
            <section className="max-w-6xl mx-auto bg-secondary-dark rounded-sm py-8 px-4 sm:px-8 border-4 border-secondary-light w-full">
              <h2 className="sm:!text-3xl !text-2xl !font-extrabold text-center mb-8 text-white">
                Open Source
              </h2>
              <div className="space-y-6 text-base leading-relaxed">
                <p className="text-white/95">
                  Dance Chives is an open source project, licensed under the
                  Apache License 2.0. We believe in transparency, community
                  collaboration, and the power of open development. The source
                  code is available for anyone to view, contribute to, and learn
                  from.
                </p>
                <p className="text-white/95">
                  We welcome contributions from the community! Whether
                  you&apos;re a developer, designer, or dance enthusiast, there
                  are many ways to get involved. Join our Discord to connect
                  with the team, see current tickets, and learn how you can help
                  shape the future of Dance Chives.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8">
                  {/* GitHub Button */}
                  <a
                    href="https://github.com/BenTheChi/dance-chives"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-[#24292e] card w-35 h-35 flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="80"
                      height="80"
                      fill="white"
                      viewBox="0 0 16 16"
                      className="group-hover:fill-primary-light transition-colors"
                    >
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                  </a>
                  {/* Discord Button */}
                  <a
                    href="https://discord.gg/HfYg868Ay4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-[#5865F2] card w-35 h-35 flex items-center justify-center"
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
                </div>
              </div>
            </section>
            {/* Community Guidelines Section */}
            {/* <section className="max-w-6xl mx-auto bg-primary rounded-sm py-8 px-4 sm:px-8 border-4 border-primary-light w-full">
              <h2 className="sm:!text-3xl !text-2xl !font-extrabold text-center mb-8">
                Community Guidelines
              </h2>
              <div className="space-y-6 text-lg">
                <p>
                  Dance Chives is built on respect, inclusivity, and the shared
                  love of street dance culture. We are committed to maintaining
                  a positive and welcoming environment for all members of our
                  community.
                </p>
                <p>
                  Our community guidelines outline the standards and
                  expectations for participation on the platform. These
                  guidelines help ensure that Dance Chives remains a safe,
                  respectful, and constructive space for everyone.
                </p>
                <div className="flex justify-center mt-6">
                  <Link
                    href="/community-guidelines"
                    className="bg-accent-blue text-charcoal px-6 py-3 rounded-sm font-rubik-mono-one text-lg hover:bg-accent-blue/90 transition-colors pointer-events-none opacity-50"
                  >
                    View Community Guidelines
                  </Link>
                </div>
              </div>
            </section> */}

            {/* Creator Section */}
            {/* <section className="max-w-6xl mx-auto bg-secondary-dark rounded-sm py-8 px-4 sm:px-8 border-4 border-secondary-light w-full">
              <h2 className="sm:!text-3xl !text-2xl !font-extrabold text-center mb-8">
                About the Creator
              </h2>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-shrink-0">
                  <Image
                    src="/ben-chi.jpg"
                    alt="Ben Chi"
                    width={200}
                    height={200}
                    className="rounded-sm border-4 border-secondary-light object-cover"
                    style={{ aspectRatio: "1/1" }}
                  />
                </div>
                <div className="flex-1 space-y-4 text-lg">
                  <h3 className="text-2xl font-bold">Ben Chi</h3>
                  <p>
                    Dance Chives was created by Ben Chi aka Heartbreaker, a long
                    time street dancer. He was first introduced to breaking and
                    popping in 2007 when he was 17 years old through Youtube and
                    a site called Bboy.org. It was a vital moment of being
                    introduced into an underground culture of freestyle dance
                    which led him to eventually discover his local scene in
                    Maui.
                    <br />
                    <br />
                    In 2015 he moved to Seattle. He explored new styles and a
                    new dance commmunity. He continued to watch battles on
                    Youtube and watched how technology evolved with street
                    dance. The community drifted from forums to Facebook and
                    then to Instagram. However, he felt like there was always
                    something lacking.
                  </p>
                </div>
              </div>
            </section> */}
          </div>
        </div>
      </main>
    </div>
  );
}
