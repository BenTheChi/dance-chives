"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section with Banner Background */}
      <section
        className="relative w-full h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/home/banner.jpg')" }}
      >
        <div className="absolute inset-0 bg-gray-900/30" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Past <span className="italic">moves</span>. Present{" "}
            <span className="italic">grooves</span>. Future{" "}
            <span className="italic">flows</span>.
          </h1>
          <p className="text-xl md:text-2xl text-white">
            Connecting dance communities through events, media, and culture
          </p>
        </div>
      </section>

      {/* About Section with Image */}
      <section className="bg-gray-800 py-16 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="relative h-[400px] bg-gray-800 rounded-lg overflow-hidden">
            <Image
              src="/home/feature.jpg"
              alt="Dance class"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-gray-100 space-y-6">
            <p className="text-lg italic">
              Ever try searching for event footage on YouTube or Instagram… only
              to give up because the algorithms make it impossible? Ever miss a
              jam, class, or workshop because you heard about it too late? Want
              to connect more with your local and global dance community but
              don&apos;t know how?
            </p>
            <div>
              <p className="text-lg mb-4">
                <strong>Dance Chives</strong> is a free web platform dedicated
                to preserving grass roots community events while helping dancers
                share and network. By combining archival access with upcoming
                event promotion, we ensure that every movement and every moment
                reaches the audience it deserves.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <button className="bg-white text-gray-900 px-8 py-3 text-lg font-semibold border-2 border-white hover:bg-gray-200 transition-colors rounded-lg">
                Join Early Access
              </button>
              <button className="bg-gray-800 text-white px-8 py-3 text-lg font-semibold border-2 border-gray-400 hover:bg-gray-700 transition-colors rounded-lg">
                Contribute
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="bg-gray-800 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: "Organize",
              image: "/home/organize.jpg",
              anchor: "organize",
            },
            { name: "Connect", image: "/home/connect.jpg", anchor: "connect" },
            { name: "Share", image: "/home/share.jpg", anchor: "share" },
            { name: "Battle", image: "/home/battle.jpg", anchor: "battle" },
          ].map((feature) => (
            <Link
              key={feature.name}
              href={`/features#${feature.anchor}`}
              className="group relative h-[300px] overflow-hidden rounded-lg"
            >
              <Image
                src={feature.image}
                alt={feature.name}
                fill
                className="object-cover blur-sm group-hover:blur-none transition-all duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <h3 className="text-white text-4xl md:text-5xl font-bold transition-all duration-300 group-hover:text-6xl">
                  {feature.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gray-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8">
            Waitlist/Newsletter Form Here
          </h2>
          <div className="bg-[#2A2A2A] h-48 flex items-center justify-center rounded-lg border-2 border-gray-600">
            <p className="text-xl text-gray-300 font-semibold">
              Newsletter Form Placeholder
            </p>
          </div>
        </div>
      </section>

      {/* Contribution Section */}
      <section className="bg-gray-800 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-12">
            Want to help shape the future of Dance Chives?
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Discord Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-100">
                Join the Discord
              </h3>
              <a
                href="https://discord.gg/HfYg868Ay4"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#5865F2] hover:bg-[#4752C4] transition-colors h-40 rounded-lg flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="80"
                  fill="white"
                  viewBox="0 0 16 16"
                >
                  <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
                </svg>
              </a>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <p className="text-gray-300">
                  Become an open source contributor or early access alpha
                  tester. Help in any form big or small is always welcome.
                </p>
                <p className="text-gray-300">
                  Give feedback on the platform and connect with the creators of
                  Dance Chives.
                </p>
              </div>
            </div>

            {/* Donate Section */}
            <div className="space-y-6">
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
