import { AppNavbar } from "@/components/AppNavbar";
import Link from "next/link";
import { ReportLink } from "@/components/report/ReportLink";
import { Pencil, Settings } from "lucide-react";

export default function EventManagementPage() {
  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">Event Management</h1>

        {/* Main Section */}
        {/* <section
          id="how-to-manage"
          className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8"
        >
           
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            How to Add and Edit Events
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                1
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Access the Event Form
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              To add a new event, click "Add Event" on the{" "}
              <Link href="/events" className="text-primary-light">
                events page
              </Link>
              . To edit an existing event, go to the event page then click{" "}
              <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-periwinkle text-black border border-black">
                <Pencil className="h-4 w-4" />
              </span>{" "}
              near the bottom of the page next to the event owner. You must be
              the event owner or a team member to edit an event.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                2
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Understanding the Event Form Tabs
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              The event form is organized into several tabs, each serving a
              specific purpose:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed text-white ml-20">
              <li>
                <strong>Details:</strong> Basic event information including
                title, city, dates, description, location, cost, prize, event
                type, and poster. This is where you set the core information
                about your event.
              </li>
              <li>
                <strong>Roles:</strong> Assign event-level roles to people
                involved in organizing and running the event. These roles help
                recognize everyone who contributed to making the event happen.
              </li>
              <li>
                <strong>Sections:</strong> Create and organize sections within
                your event. Sections are the main organizational units where
                videos are stored. You can categorize sections by type (Battle,
                Tournament, Competition, Performance, Showcase, Class, Session,
                Mixed) and organize videos within them, optionally using
                brackets for structured competitions.
              </li>
              <li>
                <strong>Photo Gallery:</strong> Upload and manage photos from
                your event. You can add multiple photos to create a gallery
                showcasing your event. Photos can be reordered by dragging them,
                and you can remove photos as needed.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                3
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Saving Your Event
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              You can work on your event across multiple tabs and save your
              progress at any time. Click "Save Event" at the bottom of the form
              to save your changes. Required fields (Title, City, Type, and
              Date) must be filled before you can save. Once saved, your event
              will be live on Dance Chives and visible to the community.
            </p>
          </div>
        </section> */}
        {/* Important Note about Access */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-secondary-light pb-3">
            Understanding Edit vs. Settings Access
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-neutral-700/50 rounded-sm border-l-4 border-primary-light">
              <h3 className="text-lg font-semibold text-white mb-2">
                Who Can Edit Events
              </h3>
              <p className="text-base leading-relaxed text-white">
                <strong className="text-primary-light">
                  Event owners and team members
                </strong>{" "}
                can edit events (change details, add sections, manage videos,
                etc.) through the "Edit Event" page accessed via the{" "}
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-periwinkle text-black border border-black mx-1">
                  <Pencil className="h-4 w-4" />
                </span>{" "}
                button.
              </p>
            </div>

            <div className="p-4 bg-neutral-700/50 rounded-sm border-l-4 border-amber-500">
              <h3 className="text-lg font-semibold text-white mb-2">
                Settings Access (Owner Only)
              </h3>
              <p className="text-base leading-relaxed text-white mb-3">
                <strong className="text-amber-400">Only the event owner</strong>{" "}
                can access the "Settings" page, which is used to manage team
                members, hide events, delete events, and transfer ownership.
              </p>
              <p className="text-base leading-relaxed text-white">
                Access settings via the{" "}
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-periwinkle text-black border border-black mx-1">
                  <Settings className="h-4 w-4" />
                </span>{" "}
                button on your event page.
              </p>
            </div>
          </div>
        </section>

        {/* Event Visibility Section */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Managing Event Visibility
          </h2>

          {/* How to Hide an Event */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                1
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                How to Hide an Event
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              If you want to temporarily hide an event from public view, go to
              your event's settings page (accessible from your{" "}
              <Link href="/dashboard" className="text-primary-light">
                dashboard
              </Link>
              ) and toggle the "Hide Event" option. Hidden events are only
              visible to you and your team members. This is useful if you need
              to make changes without the event being publicly accessible, or if
              you want to prepare an event before making it live. You can unhide
              the event at any time by toggling the setting again.
            </p>
            <p className="text-base leading-relaxed ml-16 mt-4 text-white">
              <strong>Note:</strong> Only the event owner can access the
              settings page. Team members cannot hide or unhide events.
            </p>
          </div>
        </section>

        {/* Deleting Events Section */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Deleting Events
          </h2>

          {/* How to Delete an Event */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                1
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                How to Delete an Event
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              Deleting an event is permanent and cannot be undone. Only the
              event owner can delete an event. To delete an event, go to your
              event's settings page and scroll to the bottom. Click "Delete
              Event" and confirm the action when prompted. This will permanently
              remove all event data, including videos, photos, sections, roles,
              and all associated content. Make sure you want to permanently
              remove everything before proceeding.
            </p>
            <div className="ml-16 mt-4 p-4 bg-amber-900/30 rounded-sm border border-amber-600">
              <p className="text-sm font-medium text-white mb-2">
                ⚠️ Important Warning
              </p>
              <p className="text-sm text-white">
                Deleting an event cannot be undone. All videos, photos,
                sections, and associated data will be permanently removed.
                Consider hiding the event instead if you just want to remove it
                from public view.
              </p>
            </div>
          </div>
        </section>

        {/* Team Members Section */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Managing Team Members
          </h2>

          {/* How to Add Team Members */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                1
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                How to Add Team Members
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              Team members can help you manage your event. To add a team member,
              go to your event's settings page (only accessible to the event
              owner) and navigate to the "Team Members" section. Click "Add Team
              Member" and search for the user you want to add by their username
              or display name. Once added, they will receive a notification and
              gain access to manage the event.
            </p>
          </div>

          {/* What Team Members Can Do */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                2
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                What Team Members Can Do
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              Team members have access to most event management features:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed text-white ml-20">
              <li>
                <strong>Edit event details:</strong> Update event information,
                dates, description, location, and other details
              </li>
              <li>
                <strong>Manage roles:</strong> Add, edit, and remove event-level
                roles (Organizers, DJs, MCs, etc.)
              </li>
              <li>
                <strong>Manage sections:</strong> Create, edit, and organize
                sections within the event
              </li>
              <li>
                <strong>Manage videos:</strong> Add, edit, and remove videos
                within sections
              </li>
              <li>
                <strong>Manage photo gallery:</strong> Upload, reorder, and
                remove photos
              </li>
              <li>
                <strong>Approve tagging requests:</strong> Review and approve or
                deny role tagging requests from other users
              </li>
              <li>
                <strong>Tag people directly:</strong> Assign roles to users
                without requiring approval
              </li>
            </ul>
            <p className="text-base leading-relaxed ml-16 mt-4 text-white">
              However, team members <strong>cannot</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed text-white ml-20">
              <li>Access the event settings page</li>
              <li>Hide or unhide the event</li>
              <li>Transfer event ownership to another user</li>
              <li>Delete the event</li>
              <li>Remove the event owner</li>
              <li>Add or remove other team members</li>
            </ul>
          </div>

          {/* Removing Team Members */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                3
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Removing Team Members
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              Only the event owner can remove team members. To remove a team
              member, go to the "Team Members" section in your event settings
              page (only accessible to the event owner) and click the remove
              button next to the team member you want to remove. They will lose
              access to manage the event immediately.
            </p>
          </div>
        </section>

        {/* Ownership Transfer Section */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Transferring Event Ownership
          </h2>

          {/* Ownership Transfer Info */}
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-white">
              If you need to transfer ownership of your event to another user,
              you can do so through the event settings. For detailed
              instructions on how to transfer ownership and what happens when
              ownership is transferred, please see the{" "}
              <Link
                href="/help/page-ownership"
                className="text-primary-light underline hover:text-primary"
              >
                Page Ownership
              </Link>{" "}
              help page.
            </p>
            <p className="text-base leading-relaxed text-white">
              Only the current event owner can transfer ownership. Once
              transferred, the new owner will have full control of the event,
              including the ability to delete it, add or remove team members,
              and transfer ownership again.
            </p>
          </div>
        </section>

        {/* Additional Resources Section */}
        <section className="bg-amber-900/30 border-2 border-amber-600 rounded-sm p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white">
            Need Additional Help?
          </h2>
          <p className="text-base leading-relaxed text-white">
            If you encounter issues managing your event or have questions about
            event management features, please{" "}
            <ReportLink className="text-primary-light underline hover:text-primary">
              file a report
            </ReportLink>
            . For more information about role tagging, see the{" "}
            <Link
              href="/help/role-tagging"
              className="text-primary-light underline hover:text-primary"
            >
              Role Tagging
            </Link>{" "}
            help page.
          </p>
        </section>
      </div>
    </>
  );
}
