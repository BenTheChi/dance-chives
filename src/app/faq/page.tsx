"use client";

import { AppNavbar } from "@/components/AppNavbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
            Adding Events
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="adding-events-video"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                Video Walkthrough: How to Add Events
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
              value="how-add-event"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I add an event?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    To add an event, click "Add Event" in the navigation or go
                    to the add event page. Fill out the event details form with
                    information about your event. You'll need to provide at
                    minimum the event title, city, type, and date.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Add event form
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
              value="required-details"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What event details are required?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    The only mandatory fields are Title, City, Type, and Date.
                    All other fields like description, location, cost, prize,
                    and schedule are optional but help provide more information
                    to attendees.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Required fields highlighted in event form
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
              value="add-roles"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I add roles (DJ, MC, Organizer, etc)?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    In the event form, navigate to the "Roles" tab. Click "Add
                    Role" and select a role type (Organizer, DJ, MC,
                    Photographer, Videographer, or Designer). Then search for
                    and select the user you want to assign to that role. You can
                    add multiple people to the same role type if needed.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Adding roles interface
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
              value="tag-people-videos"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I tag people in videos?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    When adding or editing a video, you can tag people in
                    different roles based on the video type:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                    <li>
                      <strong>Battle videos:</strong> Tag dancers and winners
                    </li>
                    <li>
                      <strong>Freestyle videos:</strong> Tag dancers
                    </li>
                    <li>
                      <strong>Choreography videos:</strong> Tag dancers and
                      choreographers
                    </li>
                    <li>
                      <strong>Class videos:</strong> Tag dancers and teachers
                    </li>
                  </ul>
                  <p className="mb-4">
                    Use the tagging interface in the video form to search for
                    and add tags. People you tag will be notified and can see
                    the video on their profile.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Video tagging interface
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
              value="add-section"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I add a section?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    In the event form, go to the "Sections" tab and click "Add
                    Section". Enter a title and select the section type (Battle,
                    Tournament, Competition, Performance, Showcase, Class,
                    Session, Mixed, or Other). You can add a description, choose
                    whether to use brackets, and add styles that apply to the
                    section.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Adding a section
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
              value="add-bracket"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I add a bracket?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    For sections that use brackets, navigate to the section in
                    the event form and click "Add Bracket". Enter a bracket
                    title (e.g., "Top 8", "Finals", "Prelims") and then add
                    videos to that bracket. You can create multiple brackets
                    within a section to organize different rounds or groups.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Adding a bracket within a section
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
              value="add-video"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I add a video?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Within a section (or bracket), click "Add Video". Enter the
                    video title and URL (YouTube, Vimeo, etc.). Select the video
                    type (battle, freestyle, choreography, or class) and add any
                    relevant dance styles. Then tag the people involved in the
                    video based on their roles.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Adding a video form
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
              value="add-photos"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I add photos to my event?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    In the event form, navigate to the "Photo Gallery" tab.
                    Click "Add Photo" and upload images from your device. You
                    can add multiple photos to create a gallery showcasing your
                    event. Photos can be reordered by dragging them, and you can
                    remove photos by clicking the delete button.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Photo gallery upload interface
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

        {/* Event Admin Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Event Admin
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="change-ownership"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I change event ownership?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Event ownership can be transferred to another user through
                    the event settings page. Navigate to your event's settings
                    and use the "Transfer Ownership" option. You'll need to
                    search for and select the new owner. Once transferred, the
                    new owner will have full control of the event.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Event settings with ownership transfer option
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
              value="add-team-members"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I add team members?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Team members can help manage your event. In the event
                    settings, go to the "Team Members" section and click "Add
                    Team Member". Search for the user you want to add. Team
                    members can help approve tagging requests, edit event
                    details, and manage content, but cannot transfer ownership
                    or delete the event.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Adding team members interface
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
              value="hide-event"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I hide an event?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    If you want to temporarily hide an event from public view,
                    go to the event settings and toggle the "Hide Event" option.
                    Hidden events are only visible to you and your team members.
                    You can unhide the event at any time.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Event visibility settings
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
              value="delete-event"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                How do I delete an event?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    Deleting an event is permanent and cannot be undone. In the
                    event settings, scroll to the bottom and click "Delete
                    Event". You'll be asked to confirm this action. Only the
                    event owner can delete an event. Make sure you want to
                    permanently remove all event data, videos, photos, and
                    associated content before proceeding.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Delete event confirmation dialog
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

        {/* Tagging and Roles Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Tagging and Roles
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="why-tagging-important"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                Why is tagging important?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Tagging helps connect people to events. Your contributions
                    and participation in events deserve to be recognized and
                    remembered. When you're tagged in an event, section, or
                    video, it appears on your profile, creating a comprehensive
                    record of your dance journey. Tagging also helps others
                    discover your work and connect with you.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="who-can-tag"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                Who can I tag?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    If you are not a team member or owner of an event you can
                    request a tag for yourself wherever you see a green button
                    on an event. It will be approved by the event team.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Green "Tag Yourself" button on event page
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
              value="can-others-tag"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                Can other people tag me?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="mb-4">
                    The event team and admins can tag you in events. You'll
                    automatically be added and notified. You are always able to
                    remove any of your tags.
                  </p>
                  <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light">
                    <p className="text-muted-foreground mb-2">
                      Screenshot: Notification of being tagged
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
              value="event-roles"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What are the roles for events?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Event roles recognize people who contribute to organizing
                    and running events:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mt-2 mb-4 ml-4">
                    <li>
                      <strong>Organizer:</strong> People who organize and plan
                      the event
                    </li>
                    <li>
                      <strong>DJ:</strong> DJs who provide music for the event
                    </li>
                    <li>
                      <strong>MC:</strong> Masters of Ceremony who host and
                      announce
                    </li>
                    <li>
                      <strong>Photographer:</strong> People who take photos at
                      the event
                    </li>
                    <li>
                      <strong>Videographer:</strong> People who film the event
                    </li>
                    <li>
                      <strong>Designer:</strong> People who create graphics,
                      posters, and visual content
                    </li>
                  </ul>
                  <p>
                    Event owners can also add team members who help manage the
                    event but don't have a specific role.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="section-roles"
              className="border-2 border-secondary-light rounded-sm mb-3 bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What are the roles for sections?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Section roles recognize achievements and contributions
                    within specific parts of an event:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mt-2 mb-4 ml-4">
                    <li>
                      <strong>Winner:</strong> People who won a section (battle,
                      competition, etc.)
                    </li>
                    <li>
                      <strong>Judge:</strong> People who judged a section
                    </li>
                  </ul>
                  <p>
                    Section winners and judges are displayed on the section page
                    and appear on their profiles.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="video-roles"
              className="border-2 border-secondary-light rounded-sm bg-background/50 !border-b-2"
            >
              <AccordionTrigger className="text-left text-xl font-medium font-display leading-none px-4 py-5 hover:bg-secondary-light/20 transition-colors">
                What are the roles for videos?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5 pt-2">
                <div className="space-y-3 text-base leading-relaxed">
                  <p>
                    Video roles depend on the type of video and recognize
                    different types of participation:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mt-2 mb-4 ml-4">
                    <li>
                      <strong>Dancer:</strong> Available for all video types -
                      people who danced in the video
                    </li>
                    <li>
                      <strong>Winner:</strong> Only for battle videos - people
                      who won the battle
                    </li>
                    <li>
                      <strong>Choreographer:</strong> Only for choreography
                      videos - people who created the choreography
                    </li>
                    <li>
                      <strong>Teacher:</strong> Only for class videos - people
                      who taught the class
                    </li>
                  </ul>
                  <p>
                    Video roles help viewers understand who was involved and in
                    what capacity, making it easy to discover content by
                    specific dancers, choreographers, or teachers.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
