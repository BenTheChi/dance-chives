"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitHomepageSubmission } from "@/lib/server_actions/submission_actions";
import { initialSubmissionFormState } from "@/lib/submissions/submission-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Submitting..." : "Submit"}
    </Button>
  );
}

export function HomeSubmissionForm() {
  const [state, formAction] = useActionState(
    submitHomepageSubmission,
    initialSubmissionFormState
  );

  return (
    <section className="w-full max-w-3xl mx-auto bg-secondary-dark rounded-sm border-4 border-secondary-light p-4 sm:p-6">
      <h3 className="!text-2xl sm:!text-3xl !font-rubik-mono-one text-outline mb-3 text-center">
        Submit an Event
      </h3>
      <p className="text-center mb-6">
        Send an IG post/reel URL, event details, or both. Only submit public
        dance events. Submissions will be reviewed within 48 hours.
      </p>

      {state.status === "success" ? (
        <div className="rounded-sm border-2 border-primary-light bg-charcoal p-4 text-center">
          <p className="!text-lg">{state.message}</p>
          <p className="text-sm mt-2">
            Refresh the page to submit another lead.
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="instagramUrl" className="block font-semibold">
              Instagram URL
            </label>
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              placeholder="https://www.instagram.com/p/.../ or /reel/.../"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="blob" className="block font-semibold">
              Event Details
            </label>
            <Textarea
              id="blob"
              name="blob"
              placeholder="This is optional if sending an IG URL.  Enter as much detail as possible for example: Title, Type (Session, Battle, Workshop), Description, Dates, Times, Location, Cost, Prize, Organizer, DJ, etc."
              rows={7}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block font-semibold">
              Email (optional)
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="If you would like to be notified of the event creation"
            />
          </div>

          {state.status === "error" && (
            <p className="text-red-300 font-semibold" role="alert">
              {state.message}
            </p>
          )}

          <div className="flex justify-center pt-2">
            <SubmitButton />
          </div>
        </form>
      )}
    </section>
  );
}
