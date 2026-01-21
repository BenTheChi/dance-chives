import Link from "next/link";
import Image from "next/image";
import { ReportLink } from "@/components/report/ReportLink";
import { PencilIcon, Settings } from "lucide-react";

export default function PageOwnershipPage() {
  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">Page Ownership</h1>

        {/* Removal Request Section */}
        <section className="bg-amber-900/30 border-2 border-amber-600 rounded-sm p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white">
            Request Event Removal
          </h2>
          <p className="text-base leading-relaxed text-white">
            If you would like your event or footage removed from Dance Chives
            and you are not the current page owner, please{" "}
            <ReportLink className="text-primary-light underline hover:text-primary">
              file a report
            </ReportLink>{" "}
            or email{" "}
            <a
              href="mailto:support@dancechives.com"
              className="text-primary-light underline hover:text-primary"
            >
              support@dancechives.com
            </a>{" "}
            with the subject "Remove Event". In the body include a link of the
            event or section page with footage to remove and your role in the
            event (organizer, videographer).
          </p>
        </section>

        {/* Main Section */}
        <section
          id="how-to-request"
          className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            How to Request Page Ownership
          </h2>

          {/* Step 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                1
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Navigate to the Event Page
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16">
              Go to the event page for which you want to request ownership. Make
              sure you are logged into your account. If you need to create an
              account, you can do so{" "}
              <Link href="/signup" className="text-primary-light">
                here
              </Link>
              .
            </p>
            <Image
              src="/screenshots/request-ownership-button.png"
              alt="Request Ownership Button"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
          </div>

          {/* Step 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                2
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Click the Request Ownership Button
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16">
              Click the "Request Ownership" button at the bottom of the event
              page. A dialog will appear asking you to confirm your request.
            </p>
            <Image
              src="/screenshots/request-ownership-dialogue.png"
              alt="Request Ownership Dialog"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                3
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Submit and Wait for Approval
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16">
              Submit your ownership request. The current event owner or
              administrators will review your request. You will receive a
              notification on your profile once your request has been approved
              or denied. You can see the status of your request on the{" "}
              <Link href="/dashboard" className="text-primary-light">
                dashboard
              </Link>
              .
            </p>
            <Image
              src="/screenshots/request-ownership-status.png"
              alt="Request Ownership Status in Dashboard"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
          </div>

          {/* Step 4 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                4
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Confirm Ownership
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16">
              Once your request has been approved, you will be able to manage
              the event details and attribution on Dance Chives. Go to your{" "}
              <Link href="/dashboard" className="text-primary-light">
                dashboard
              </Link>{" "}
              and click on the event you want to manage. For help on how to
              manage the event, see the{" "}
              <Link href="/help/event-management">Event Management</Link> page.
            </p>
            <Image
              src="/screenshots/your-events.png"
              alt="Request Ownership Status in Dashboard"
              width={1000}
              height={1000}
              className="border-4 border-secondary-light rounded-sm"
            />
          </div>
        </section>

        {/* Team Membership Section */}
        <section
          className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8 scroll-mt-24"
          id="team-membership"
        >
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            How to Request Team Membership
          </h2>

          {/* What is a Team Member */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                1
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                What is a Team Member?
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              Team members are users who have been granted edit access to help
              manage an event on Dance Chives. They work alongside the event
              owner to maintain event details, manage roles, and keep the event
              information up to date. Team members are separate from event{" "}
              <Link href="/help/role-tagging" className="text-primary-light">
                roles
              </Link>{" "}
              and are specifically designated to help with event management.
            </p>
          </div>

          {/* What Access Do Team Members Have */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                2
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                What Access Do Team Members Have?
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              Team members have access to{" "}
              <Link href="/help/add-edit-events" className="text-primary-light">
                edit event
              </Link>{" "}
              features. This is accessed by clicking the{" "}
              <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-periwinkle text-black border border-black mx-1">
                <PencilIcon className="h-4 w-4" />
              </span>{" "}
              button at the bottom of the event page.
            </p>
            <p className="text-base leading-relaxed ml-16 text-white">
              Team members can also approve or deny role tagging requests from
              other users. You'll be notified when you have a request to review
              and it can be accessed on your{" "}
              <Link href="/dashboard" className="text-primary-light">
                dashboard
              </Link>
              .
            </p>
            <p className="text-base leading-relaxed ml-16 mt-4 text-white">
              However, team members <strong>cannot</strong>: access the event
              settings page, hide or unhide the event, transfer event ownership,
              delete the event, or add or remove other team members.
            </p>
          </div>

          {/* How to Request Team Membership */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                3
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                How to Request Team Membership
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              To request team membership for an event:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-base leading-relaxed text-white ml-20">
              <li>
                Navigate to the event page for which you want to request team
                membership. Make sure you are logged into your account. If you
                need to create an account, you can do so{" "}
                <Link href="/signup" className="text-primary-light">
                  here
                </Link>
                .
              </li>
              <li>
                Look for the "Request Team Membership" button on the event page.
                This button is only visible if you are not already a team member
                and are not the event owner.
              </li>
              <li>
                Click the button and confirm your request. A notification will
                be sent to the event owner and existing team members for review.
              </li>
              <li>
                Wait for approval. You will receive a notification on your
                profile once your request has been approved or denied. You can
                see the status of your request on your{" "}
                <Link href="/dashboard" className="text-primary-light">
                  dashboard
                </Link>
                .
              </li>
            </ol>
            <p className="text-base leading-relaxed ml-16 mt-4 text-white">
              Note: If you are the event owner or already a team member, you
              will not see the request button. Event owners already have full
              access to manage their events.
            </p>
          </div>

          {/* How to Remove Yourself from a Team */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                4
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                How to Remove Yourself from a Team
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              If you no longer wish to be a team member of an event, you can
              remove yourself at any time. On the event page, find your avatar
              in the Team Members section. Click the remove button (X) that
              appears on your own avatar. You will immediately lose access to
              manage the event.
            </p>
          </div>

          {/* How to Remove Team Members as Event Owner */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                5
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                How to Remove Team Members (Event Owner)
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16 text-white">
              As the event owner, you can remove team members at any time. To
              remove a team member, go to your event&apos;s settings page
              (accessible by clicking the{" "}
              <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-periwinkle text-black border border-black mx-1">
                <Settings className="h-4 w-4" />
              </span>{" "}
              button on the bottom of the event page) and navigate to the
              &quot;Team Members&quot; section. Click the remove button (X) next
              to the team member you want to remove. They will immediately lose
              access to manage the event. Note: Only the event owner can access
              the settings page and remove team members.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
