import { AppNavbar } from "@/components/AppNavbar";
import Link from "next/link";
import Image from "next/image";
import { ReportLink } from "@/components/report/ReportLink";

export default function PageOwnershipPage() {
  return (
    <>
      <AppNavbar />
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
      </div>
    </>
  );
}
