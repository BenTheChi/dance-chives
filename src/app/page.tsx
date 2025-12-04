"use client";

import Image from "next/image";
import {
  HeroSection,
  SectionContainer,
  FeatureLinkCard,
  FeaturesGrid,
  CTAButton,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="w-full bg-[#f5f5f5]">
      <HeroSection
        backgroundImage="/home/banner.jpg"
        title={
          <>
            Past <span className="italic">moves</span>. Present{" "}
            <span className="italic">grooves</span>. Future{" "}
            <span className="italic">flows</span>.
          </>
        }
        subtitle="Connecting dance communities through events, media, and culture"
        overlayOpacity={40}
      />

      {/* About Section with Image */}
      <SectionContainer bgColor="bg-[#c4ffd9]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="relative h-[450px] bg-[#f5f5f5] border-8 border-black overflow-hidden">
            <Image
              src="/home/feature.jpg"
              alt="Dance class"
              fill
              className="object-cover mr-10"
            />
          </div>
          <div className="text-[#2a2a2a] space-y-6">
            <p className="text-xl font-bold italic leading-relaxed">
              Ever try searching for event footage on YouTube or Instagram… only
              to give up because the algorithms make it impossible? Ever miss a
              jam, class, or workshop because you heard about it too late? Want
              to connect more with your local and global dance community but
              don&apos;t know how?
            </p>
            <div>
              <p className="text-xl mb-6 font-bold leading-relaxed">
                <span className="text-3xl font-black uppercase">
                  Dance Chives
                </span>{" "}
                is a free web platform dedicated to preserving grass roots
                community events while helping dancers share and network. By
                combining archival access with upcoming event promotion, we
                ensure that every movement and every moment reaches the audience
                it deserves.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4 flex-wrap mt-12">
          <CTAButton
            variant="primary"
            onClick={() => (window.location.href = "#newsletter")}
          >
            Join Early Access
          </CTAButton>
          <CTAButton
            variant="secondary"
            onClick={() => (window.location.href = "#contribute")}
          >
            Contribute
          </CTAButton>
        </div>
      </SectionContainer>

      {/* Feature Cards Section */}
      <SectionContainer>
        <FeaturesGrid columns={4} gap="gap-6">
          {[
            {
              name: "Organize",
              image: "/home/organize.jpg",
              anchor: "organize",
            },
            {
              name: "Connect",
              image: "/home/connect.jpg",
              anchor: "connect",
            },
            {
              name: "Share",
              image: "/home/share.jpg",
              anchor: "share",
            },
            {
              name: "Battle",
              image: "/home/battle.jpg",
              anchor: "battle",
            },
          ].map((feature) => (
            <FeatureLinkCard
              key={feature.name}
              name={feature.name}
              image={feature.image}
              anchor={feature.anchor}
            />
          ))}
        </FeaturesGrid>
      </SectionContainer>

      {/* Newsletter Section */}
      <SectionContainer id="newsletter" bgColor="bg-[#c4ffd9]" padding="py-12">
        <div className="ml-embedded" data-form="op8sua"></div>
      </SectionContainer>

      {/* Contribution Section */}
      <SectionContainer bgColor="bg-[#3a3a3a]" borderColor="border-transparent">
        <div className="max-w-6xl mx-auto text-center">
          <h2
            id="contribute"
            className="text-4xl font-black text-[#f5f5f5] mb-12 uppercase tracking-tight"
          >
            Want to help shape the future of Dance Chives?
          </h2>
          <div className="flex justify-center">
            {/* Discord Section */}
            <div className="space-y-6 max-w-md">
              <h3 className="text-2xl font-black text-[#c4ffd9] uppercase tracking-wide">
                Join the Discord
              </h3>
              <a
                href="https://discord.gg/HfYg868Ay4"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#5865F2] hover:bg-[#c4ffd9] transition-colors duration-75 h-40 border-8 border-black flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="80"
                  fill="white"
                  viewBox="0 0 16 16"
                  className="group-hover:fill-[#2a2a2a]"
                >
                  <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
                </svg>
              </a>
              <div className="space-y-3">
                <p className="text-[#f5f5f5] text-lg font-bold leading-relaxed">
                  Become an open source contributor or early access alpha
                  tester. Help in any form big or small is always welcome.
                </p>
                <p className="text-[#f5f5f5] text-lg font-bold leading-relaxed">
                  Give feedback on the platform and connect with the creators of
                  Dance Chives.
                </p>
              </div>
            </div>

            {/* Donate Section */}
            {/* <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-100">Donate</h3>
              <div className="bg-gray-800 h-40 rounded-lg flex items-center justify-center border-2 border-gray-600">
                <p className="text-gray-300">Donate Button Placeholder</p>
              </div>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <p className="text-gray-300">
                  Dance Chives is currently pre-revenue. Every dollar in these
                  early stages goes directly back into the development of Dance
                  Chives.
                </p>
                <p className="text-gray-300">
                  Dance Chives is a for-profit organization. Donations are not
                  tax-deductible
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
