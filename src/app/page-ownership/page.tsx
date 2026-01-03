"use client";

import { AppNavbar } from "@/components/AppNavbar";

export default function PageOwnershipPage() {
  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">Page Ownership</h1>

        {/* Main Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-8">
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
              sure you are logged into your account.
            </p>
            <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light ml-16">
              <p className="text-muted-foreground mb-2">
                Screenshot: Event page showing the ownership request button
              </p>
              <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                <span className="text-muted-foreground">
                  [Screenshot placeholder]
                </span>
              </div>
            </div>
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
              Look for the "Request Ownership" button on the event page. This
              button is typically located in the event settings or near the
              event details section.
            </p>
            <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light ml-16">
              <p className="text-muted-foreground mb-2">
                Screenshot: Ownership request button highlighted on event page
              </p>
              <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                <span className="text-muted-foreground">
                  [Screenshot placeholder]
                </span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                3
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Fill Out the Request Form
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16">
              Complete the ownership request form with your information. You may
              need to provide details about why you should be the owner of this
              event page, such as being the event organizer or having the
              authority to manage the event.
            </p>
            <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light ml-16">
              <p className="text-muted-foreground mb-2">
                Screenshot: Ownership request form with fields to fill out
              </p>
              <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                <span className="text-muted-foreground">
                  [Screenshot placeholder]
                </span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-primary font-bold text-xl border-2 border-secondary-light">
                4
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Submit and Wait for Approval
              </h3>
            </div>
            <p className="text-base leading-relaxed ml-16">
              Submit your ownership request. The current event owner or
              administrators will review your request. You will receive a
              notification once your request has been approved or denied.
            </p>
            <div className="bg-muted p-4 rounded-sm border-2 border-secondary-light ml-16">
              <p className="text-muted-foreground mb-2">
                Screenshot: Confirmation message and notification for ownership
                request
              </p>
              <div className="aspect-video bg-background border-2 border-border flex items-center justify-center">
                <span className="text-muted-foreground">
                  [Screenshot placeholder]
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

