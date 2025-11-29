"use client";

import Image from "next/image";

export default function FeaturesPage() {
  return (
    <div className="w-full bg-gray-800 min-h-screen">
      {/* Hero Section with Banner Background */}
      <section
        className="relative w-full h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/home/banner.jpg')" }}
      >
        <div className="absolute inset-0 bg-gray-900/40" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Built for the community. <br />
            By the community.
          </h1>
        </div>
      </section>

      {/* Organize Section */}
      <section id="organize" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8 text-left">
            ORGANIZE event data and media
          </h2>
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-3">
                <div className="relative h-64 bg-gray-700 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Image Placeholder {item}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-center">
                  Caption for organize feature {item}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button className="bg-white text-gray-900 px-8 py-3 text-lg font-semibold border-2 border-white hover:bg-gray-200 transition-colors rounded-lg">
              Join Waitlist
            </button>
          </div>
        </div>
      </section>

      {/* Connect Section */}
      <section id="connect" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8 text-left">
            CONNECT dancers to strengthen community
          </h2>
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-3">
                <div className="relative h-64 bg-gray-700 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Image Placeholder {item}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-center">
                  Caption for connect feature {item}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button className="bg-white text-gray-900 px-8 py-3 text-lg font-semibold border-2 border-white hover:bg-gray-200 transition-colors rounded-lg">
              Join Early Access
            </button>
          </div>
        </div>
      </section>

      {/* Share Section */}
      <section id="share" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8 text-left">
            SHARE your events on the calendar
          </h2>
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-3">
                <div className="relative h-64 bg-gray-700 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Image Placeholder {item}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-center">
                  Caption for share feature {item}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button className="bg-white text-gray-900 px-8 py-3 text-lg font-semibold border-2 border-white hover:bg-gray-200 transition-colors rounded-lg">
              Join Early Access
            </button>
          </div>
        </div>
      </section>

      {/* Battle Section */}
      <section id="battle" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8 text-left">
            BATTLE at events and relive the moment here
          </h2>
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-3">
                <div className="relative h-64 bg-gray-700 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Image Placeholder {item}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-center">
                  Caption for battle feature {item}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button className="bg-white text-gray-900 px-8 py-3 text-lg font-semibold border-2 border-white hover:bg-gray-200 transition-colors rounded-lg">
              Join Early Access
            </button>
          </div>
        </div>
      </section>

      {/* Waitlist Form Section */}
      <section className="py-20 px-4 border-t border-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-8">
            Join the Early Access
          </h2>
          <div className="bg-[#2A2A2A] h-48 flex items-center justify-center rounded-lg border-2 border-gray-600">
            <p className="text-xl text-gray-300 font-semibold">
              Newsletter Form Placeholder
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
