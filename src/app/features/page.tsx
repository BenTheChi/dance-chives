"use client";

import Image from "next/image";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="w-full bg-gray-900 min-h-screen">
      {/* Hero Section with Banner Background */}
      <section
        className="relative w-full h-[500px] md:h-[600px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/features/banner2.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/50 to-gray-900/80" />

        {/* Back Link */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-20 text-white text-lg font-semibold hover:text-gray-300 transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white  leading-tight">
            Built for the community. <br />
            By the community.
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
            The complete platform for organizing, sharing, and preserving dance
            culture
          </p>
        </div>
      </section>

      {/* Organize Section */}
      <section id="organize" className="py-20 md:py-28 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ORGANIZE
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Event data and media
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12">
            {/* Feature 1 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  From workshops to battles—classify every moment
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Structure your events with 8+ event types (Battles,
                  Competitions, Classes, Workshops, Sessions, Parties,
                  Festivals, Performances) and 9 specialized section types
                  (Battle, Tournament, Competition, Performance, Showcase,
                  Class, Session, or Mixed) ensure every part of your event is
                  properly categorized and easy to find.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Videos organized by purpose, not just uploaded in bulk
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Unlike generic media dumps, Dance Chives organizes videos
                  within sections (battles, showcases, classes) and brackets.
                  Each video knows its context—what section it belongs to, who's
                  tagged, what styles are featured—making your archive
                  searchable and meaningful years later.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Posters and photos that complete the picture
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Add event and section posters for visual impact, plus up to 10
                  gallery photos with captions. Showcase the venue, crowd, and
                  in-between moments that complement your video archive and tell
                  your event's complete story.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  One page, two purposes—promote now, archive forever
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Create your event page to promote upcoming battles and
                  workshops, then return after the event to add videos, tag
                  winners, and build a permanent archive. The same structured
                  page evolves from promotional flyer to historical record.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-16 text-center">
            <button className="bg-white text-gray-900 px-10 py-4 text-lg font-bold rounded-xl hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              Join Waitlist
            </button>
          </div>
        </div>
      </section>

      {/* Connect Section */}
      <section id="connect" className="py-20 md:py-28 px-6 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              CONNECT
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Dancers to strengthen community
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12">
            {/* Feature 1 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Tag yourself, build your dance resume
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Dancers can tag themselves in videos as competitors, winners,
                  choreographers, or teachers. Your profile automatically
                  showcases your battles, wins, and contributions—building your
                  digital dance portfolio. Give credit where credit's due.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Tag event organizers, DJs, judges, teachers, and more
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Dance Chives ensures everyone who contributes to an event gets
                  recognized with role-based tagging.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Connect dancers across the world and through time
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Find dancers you've met before, track their growth, and
                  strengthen community connections.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-16 text-center">
            <button className="bg-white text-gray-900 px-10 py-4 text-lg font-bold rounded-xl hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              Join Early Access
            </button>
          </div>
        </div>
      </section>

      {/* Share Section */}
      <section id="share" className="py-20 md:py-28 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              SHARE
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Your events on the calendar
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12">
            {/* Feature 1 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Your city's dance scene all in one calendar
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  City-based calendars display every dance event happening in
                  your area. No more scattered group chats, random IG feeds, or
                  missed announcements. See what's happening at a glance.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Filter by style, type, or both—find your vibe
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Looking for breaking battles? House workshops? Popping open
                  sessions? Filter the calendar by dance style and event type to
                  surface exactly what you're interested in, skipping the rest.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Customize your dance schedule
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Save events you want to pop up on your own calendar. Go back
                  to saved events in the past and reminisce the good times.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-16 text-center">
            <button className="bg-white text-gray-900 px-10 py-4 text-lg font-bold rounded-xl hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              Join Early Access
            </button>
          </div>
        </div>
      </section>

      {/* Battle Section */}
      <section id="battle" className="py-20 md:py-28 px-6 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              BATTLE
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              At events and relive the moment here
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12">
            {/* Feature 1 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Brackets that track the competition progression structure
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Battle and tournament sections come with multi-round brackets.
                  Whether it's "Cypher prelims", "Top 8", or "Dance group 7A"
                  use custom labels to match the exact structure of your event.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Tag winners, celebrate champions
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Mark battle winners at the video and section level. Winners
                  get recognition on their profiles, and their victories become
                  part of their permanent dance record.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
              <div className="p-8 h-32 flex items-center justify-center">
                <h3 className="text-lg font-bold text-white text-center">
                  Relive the battles, study the competition
                </h3>
              </div>
              <div className="relative h-72 bg-gray-700/50">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <p className="text-md">Image Placeholder</p>
                </div>
              </div>
              <div className="p-8">
                <p className="text-md text-gray-300 leading-relaxed">
                  Battle videos are preserved with full context—who competed,
                  who won, what styles were represented. Review your round,
                  track competitors, and prepare for the next challenge.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-16 text-center">
            <button className="bg-white text-gray-900 px-10 py-4 text-lg font-bold rounded-xl hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              Join Early Access
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-gray-900 to-gray-800 border-t border-gray-700/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white ">
            Join the Early Access
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Be among the first to experience the future of dance culture
            preservation
          </p>
          <div className="bg-gray-800/60 border-2 border-gray-600/50 h-64 flex items-center justify-center rounded-2xl backdrop-blur-sm">
            <p className="text-2xl text-gray-300 font-semibold">
              Newsletter Form Placeholder
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
