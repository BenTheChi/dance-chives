import Link from "next/link";
import { ReportLink } from "@/components/report/ReportLink";
import { Plus } from "lucide-react";
import Image from "next/image";

export default function RoleTaggingPage() {
  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">Role Tagging</h1>

        {/* Disputes and Appeals Section */}
        <section className="bg-amber-900/30 border-2 border-amber-600 rounded-sm p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white">Disputes and Appeals</h2>
          <p className="text-base leading-relaxed text-white">
            If you have a dispute over a role assignment or would like to appeal
            a denied request, please{" "}
            <ReportLink className="text-primary-light underline hover:text-primary">
              file a report
            </ReportLink>
            . Include details about the event, section, or video in question,
            the role you're requesting, and any relevant information that
            supports your request.
          </p>
        </section>

        {/* Main Section */}
        <section
          id="how-to-tag"
          className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            How to Tag Yourself as a Role
          </h2>

          {/* Introduction */}
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-white">
              On Dance Chives, you can tag yourself with different roles at
              three levels: <strong>event</strong>, <strong>section</strong>,
              and <strong>video</strong>. Each level has different available
              roles and serves different purposes.
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed text-white ml-4">
              <li>
                <strong>Event-level roles</strong> (e.g., Organizer, DJ,
                Videographer, Teacher) apply to the entire event
              </li>
              <li>
                <strong>Section-level roles</strong> (e.g., Winner, Judge) apply
                to a specific section within an event
              </li>
              <li>
                <strong>Video-level roles</strong> (e.g., Dancer, Winner,
                Choreographer, Teacher) apply to a specific video
              </li>
            </ul>
          </div>

          {/* Step 1: Finding the Yellow Button */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                1
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Find the Yellow Button
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              Look for the yellow circular button with a plus icon
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent-yellow text-black border border-charcoal mx-1"
                aria-label="Tag yourself button example"
              >
                <Plus className="w-4 h-4 stroke-[3.5]" />
              </span>
              on event, section, or video pages. This button allows you to
              request a role at that specific level. The button will appear
              wherever you can tag yourself with a role.
            </p>
            <Image
              src="/screenshots/yellow-button-roles.png"
              alt="Role Tagging Button Event Page"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
            <Image
              src="/screenshots/yellow-button-section.png"
              alt="Role Tagging Button Section Page"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
            <Image
              src="/screenshots/yellow-button-video.png"
              alt="Role Tagging Button Video Page"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
          </div>

          {/* Step 2: Direct Tagging for Owners/Team Members */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                2
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Role Tagging for Event Owners/Team Members
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              If you own the event or are a team member, you have additional
              options for role assignment:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed text-white ml-20">
              <li>
                You can assign roles to yourself or other profiles directly
                through the{" "}
                <Link
                  href="/help/event-management"
                  className="text-primary-light"
                >
                  add/edit event form
                </Link>
                .
              </li>
              <li>
                When you tag yourself using the yellow button, your request is
                automatically approved and the role is assigned immediately.
              </li>
              <li>
                You can also assign roles to other users who participated in
                your event through the event management interface.
              </li>
            </ul>
          </div>

          {/* Step 3: Request System for Others */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                3
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                If You Don't Have Direct Access
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              If you don't own the event or aren't a team member, you'll need to
              request the role:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-base leading-relaxed text-white ml-20">
              <li>
                Click the yellow button and select the role you want to request
                from the dropdown menu.
              </li>
              <Image
                src="/screenshots/role-dialog.png"
                alt="Role Dialog"
                width={1000}
                height={1000}
                className="border-4 border-secondary-light rounded-sm"
              />
              <li>
                Submit your request. The request will be sent to the event
                owner, team members, moderators, or administrators for review.
              </li>
              <Image
                src="/screenshots/role-request.png"
                alt="Role Request"
                width={1000}
                height={1000}
                className="border-4 border-secondary-light rounded-sm"
              />
              <Image
                src="/screenshots/role-request-approval.png"
                alt="Role Approval"
                width={1000}
                height={1000}
                className="border-4 border-secondary-light rounded-sm"
              />
            </ol>
            <div className="ml-16 mt-4 p-4 bg-neutral-700 rounded-sm border border-neutral-500">
              <p className="text-sm font-medium text-white mb-2">
                Who Can Approve Your Request?
              </p>
              <p className="text-sm text-white">
                Tagging requests can be approved by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-white mt-2 ml-4">
                <li>The event owner</li>
                <li>Team members of the event</li>
                <li>Moderators</li>
                <li>Administrators</li>
              </ul>
            </div>
          </div>

          {/* Step 3.5: Tagging with an unregistered Instagram account */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                3.5
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Tagging with an unregistered Instagram account
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              It is also possible to tag events and assign roles to unregistered Instagram accounts. This is useful when you know the Instagram handle of the person you want to tag but they are not on Dance Chives yet. </p>
            <p className="text-base leading-relaxed ml-16 text-white">
              To tag an event and assign a role to an unregistered Instagram account, you will need to provide the Instagram handle of the account you are tagging. You will also need to provide the name of the person you are tagging. </p>
            <p className="text-base leading-relaxed ml-16 text-white">Here is an example of how to look up an Instagram account and add it to an event:</p>
            <Image
              src="/screenshots/tagpeople.png"
              alt="Tag People"
              width={1000}
              height={1000} 
              className="border-4 border-secondary-light rounded-sm"
            />
            <p className="text-base leading-relaxed ml-16 text-white">Select a role and click "Add Account". Then add the Instagram handle of the account you are tagging. You can also add a name if you want to:</p>
            <Image
              src="/screenshots/tagpeoplecreate.png"
              alt="Tag People Create"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
            <p className="text-base leading-relaxed ml-16 text-white">Once you have added the account, you will need to confirm the identity of the account. </p>
            <Image
              src="/screenshots/tagpeopleconfirm.png"
              alt="Tag People Confirm"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />

            <p>Once you've confirmed the identity of the account, you can tag the user with a role for the event.</p>
            <Image 
              src="/screenshots/tagpeopleconfirm2.png"
              alt="Tag People Confirm 2"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
          </div>

          {/* Step 4: Notifications */}
          {/* <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                4
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Notifications
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              You will receive notifications when:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed text-white ml-20">
              <li>
                Your role tagging request is <strong>approved</strong> - you'll
                be notified and the role will be linked to your profile
              </li>
              <li>
                Your role tagging request is <strong>denied</strong>
              </li>
            </ul>
            <Image
              src="/screenshots/notifications.png"
              alt="Role Tagging Notification"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
          </div> */}
        </section>
      </div>
    </>
  );
}
