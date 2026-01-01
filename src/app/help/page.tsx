"use client";

import { AppNavbar } from "@/components/AppNavbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

export default function FAQPage() {
  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">Frequently Asked Questions</h1>

        {/* Overview Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Overview
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="what-is-dance-chives"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What is Dance Chives?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Dance Chives is a platform dedicated to freestyle dance
                    culture, media, and community. We provide a space for
                    dancers, event organizers, and enthusiasts to document,
                    discover, and celebrate dance events, performances, and
                    competitions. Whether you're looking to find upcoming events
                    in your city, showcase your performances, or connect with
                    the dance community, Dance Chives is your hub for all things
                    freestyle dance.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="how-different"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How is Dance Chives different from existing social media?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Unlike traditional social media platforms, Dance Chives is
                    purpose-built for the dance community. We focus on events,
                    performances, and competitions with structured organization
                    through sections and brackets. Our tagging system connects
                    dancers to their contributions across events, creating a
                    comprehensive record of their dance journey. We prioritize
                    community-driven content organization, making it easy to
                    find events by city, style, and date, while ensuring proper
                    recognition for everyone involved in the dance scene.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="cost"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                Does it cost anything to use Dance Chives?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    All the features in the beta are free and will continue to
                    be free after. Paid tiers for enhanced members like crews
                    and businesses will be available in the next launch.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="beta-duration"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How long will the beta last?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    We're committed to building the best platform for the dance
                    community. The beta period allows us to gather feedback and
                    refine features based on real user needs. We'll announce the
                    transition to our full launch well in advance, ensuring
                    everyone has time to prepare for any new features or
                    changes.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Getting Started Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Getting Started
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="create-account"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I create an account?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Creating an account on Dance Chives is simple. Click the
                    "Sign Up" button in the navigation, and you'll be prompted
                    to enter your email address. We'll send you a magic link to
                    verify your email and complete your registration.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Sign up page with email input field
                    </p>
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Screenshot placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="register"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I register?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    After clicking the sign up link, check your email for a
                    magic link. Click the link to verify your email address and
                    complete your registration. You'll then be able to set up
                    your profile with your display name, username, city, and
                    dance styles.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Email verification and profile setup flow
                    </p>
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Screenshot placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Dashboard Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Dashboard
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="dashboard-content"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What is on the Dashboard?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Your dashboard is your central hub for managing your Dance
                    Chives activity. Here you'll find:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                    <li>
                      <strong>Tagging Requests:</strong> Requests from other
                      users to tag you in events, sections, or videos
                    </li>
                    <li>
                      <strong>Your Events:</strong> Events you've created or are
                      involved in
                    </li>
                    <li>
                      <strong>Saved Events:</strong> Events you've bookmarked
                      for easy access
                    </li>
                    <li>
                      <strong>Notifications:</strong> Updates about your
                      requests, tags, and event activity
                    </li>
                  </ul>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Dashboard view showing tagging requests and
                      event overview
                    </p>
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Screenshot placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="tagging-requests"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What are tagging requests?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Tagging requests allow users to request to be tagged in
                    events, sections, or videos. When you see a green "Tag
                    Yourself" button on an event page, you can request to be
                    tagged with a specific role. Event owners and team members
                    will review and approve or deny these requests. You'll
                    receive notifications when your requests are approved or
                    denied.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Tagging request interface and approval process
                    </p>
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Screenshot placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Profile Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Profile
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="profile-content"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What's on my profile?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Your profile showcases your dance journey and contributions
                    to the community:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                    <li>
                      <strong>Basic Info:</strong> Display name, username, bio,
                      city, and dance styles
                    </li>
                    <li>
                      <strong>Roles:</strong> Events where you've been tagged
                      with roles like Organizer, DJ, MC, Photographer, etc.
                    </li>
                    <li>
                      <strong>Sections Won:</strong> Sections where you've been
                      tagged as a winner
                    </li>
                    <li>
                      <strong>Tagged Videos:</strong> All videos where you've
                      been tagged as a dancer, winner, choreographer, or teacher
                    </li>
                    <li>
                      <strong>Events Created:</strong> Events you've organized
                      and created
                    </li>
                  </ul>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Profile page showing all sections
                    </p>
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Screenshot placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="edit-profile"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I edit my profile?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    To edit your profile, navigate to your profile page and
                    click the "Edit Profile" button. You can update your display
                    name, bio, city, dance styles, and profile picture. Changes
                    are saved automatically.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Profile edit page with form fields
                    </p>
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Screenshot placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Events Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Events
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="events-video"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                Video Walkthrough: Understanding Events
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Video embed placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="what-is-event"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What is an event?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    An event is any organized dance gathering, competition, or
                    activity. Events can be battles, competitions, classes,
                    workshops, sessions, parties, festivals, performances, or
                    other types of dance gatherings. All events share common
                    features:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                    <li>
                      <strong>Location & Date:</strong> City, venue, and date(s)
                      when the event takes place
                    </li>
                    <li>
                      <strong>Organization:</strong> Event creator, organizers,
                      and team members who manage the event
                    </li>
                    <li>
                      <strong>Sections:</strong> Different parts of the event
                      (battles, performances, classes, etc.)
                    </li>
                    <li>
                      <strong>Media:</strong> Videos, photos, and posters
                      documenting the event
                    </li>
                    <li>
                      <strong>Roles:</strong> People involved like DJs, MCs,
                      photographers, videographers, and designers
                    </li>
                  </ul>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Event page showing all components
                    </p>
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Screenshot placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="what-is-section"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What is a section?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Sections are the main organizational units within an event
                    where videos are stored. Different types of sections serve
                    different purposes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                    <li>
                      <strong>Battle:</strong> Competitive dance battles with
                      brackets
                    </li>
                    <li>
                      <strong>Tournament:</strong> Multi-stage competitions
                    </li>
                    <li>
                      <strong>Competition:</strong> Judged dance competitions
                    </li>
                    <li>
                      <strong>Performance:</strong> Showcase performances
                    </li>
                    <li>
                      <strong>Showcase:</strong> Featured dance showcases
                    </li>
                    <li>
                      <strong>Class:</strong> Dance classes and workshops
                    </li>
                    <li>
                      <strong>Session:</strong> Open dance sessions
                    </li>
                    <li>
                      <strong>Mixed:</strong> Sections with various content
                      types
                    </li>
                  </ul>
                  <p className="mb-4">
                    Sections can contain videos directly or be organized into
                    brackets for structured competitions.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Section view showing videos or brackets
                    </p>
                    <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                      <span className="text-muted-foreground">
                        [Screenshot placeholder]
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="what-is-bracket"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What is a bracket?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Brackets are organizational tools for battles and
                    competitions that help subdivide groups within a section.
                    Common bracket examples include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                    <li>Top 8, Top 16, Top 32</li>
                    <li>Prelims, Semifinals, Finals</li>
                    <li>Round 1, Round 2, etc.</li>
                    <li>
                      Style-specific brackets (e.g., "Popping", "Breaking")
                    </li>
                  </ul>
                  <p>
                    Brackets help organize videos within competitive sections,
                    making it easy to navigate through different rounds and
                    stages of a competition.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Adding Events Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Adding/Editing Events
          </h2>
          <div className="space-y-3 text-base leading-relaxed text-white">
            <p>
              For detailed information on how to add and manage events,
              including adding roles, sections, brackets, videos, and photos,
              please see our{" "}
              <Link
                href="/help/add-edit-events"
                className="text-primary-light underline hover:text-secondary-light"
              >
                Add/Edit Events
              </Link>{" "}
              guide.
            </p>
          </div>
        </section>

        {/* Event Admin Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Event Admin
          </h2>
          <div className="space-y-3 text-base leading-relaxed text-white">
            <p>
              For information on managing team members, hiding events, and
              deleting events, please see our{" "}
              <Link
                href="/help/event-management"
                className="text-primary-light underline hover:text-secondary-light"
              >
                Event Management
              </Link>{" "}
              guide.
            </p>
            <p>
              For information on transferring event ownership and requesting
              ownership of events, please see our{" "}
              <Link
                href="/help/page-ownership"
                className="text-primary-light underline hover:text-secondary-light"
              >
                Page Ownership
              </Link>{" "}
              guide.
            </p>
          </div>
        </section>

        {/* Tagging and Roles Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Tagging and Roles
          </h2>
          <div className="space-y-3 text-base leading-relaxed text-white">
            <p>
              For detailed information on how to tag yourself with roles at the
              event, section, and video levels, including how to request roles,
              who can approve requests, and what roles are available, please see
              our{" "}
              <Link
                href="/help/role-tagging"
                className="text-primary-light underline hover:text-secondary-light"
              >
                Role Tagging
              </Link>{" "}
              guide.
            </p>
          </div>
        </section>

        {/* Calendar Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Calendar
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="use-calendar"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I use the calendar?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    The calendar helps you discover upcoming dance events. You
                    can filter events by city and dance style to find what's
                    happening near you or in your areas of interest. The
                    calendar shows events for a three-month period (previous
                    month, current month, and next month) to give you a good
                    overview of upcoming activities.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="filter-by-city"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I filter events by city?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Use the city dropdown at the top of the calendar page to
                    select a city. If you're logged in, the calendar will
                    default to your city. You can change this to any city to see
                    events happening there.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="filter-by-style"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I filter events by dance style?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Use the style dropdown to filter events by specific dance
                    styles like Breaking, Popping, Locking, House, etc. You can
                    combine city and style filters to find exactly what you're
                    looking for.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="view-event-details"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I view event details from the calendar?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Click on any event in the calendar to view its full details,
                    including description, location, schedule, sections, videos,
                    and photos. You can also save events you're interested in by
                    clicking the save button.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="past-events"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                Can I see past events on the calendar?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    The calendar focuses on upcoming events, showing the current
                    month and surrounding months. To view past events, use the
                    search feature or browse events by city or style. Past
                    events remain accessible on the platform so you can view
                    videos, photos, and other content from previous gatherings.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </>
  );
}
