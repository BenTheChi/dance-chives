"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { submitHomepageSubmission } from "@/lib/server_actions/submission_actions";
import { initialSubmissionFormState } from "@/lib/submissions/submission-form-state";
import Link from "next/link";

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
    <section className="w-full bg-primary rounded-sm border-4 border-primary-light p-4 sm:p-6">
      <div className="flex flex-col items-center max-w-3xl">
        <h3 className="!text-2xl sm:!text-3xl !font-rubik-mono-one text-outline mb-3 text-center">
          Submit an Event
        </h3>
        <Accordion type="single" collapsible className="w-full mb-6">
          <AccordionItem
            value="how-it-works"
            className="border-b border-primary-light"
          >
            <AccordionTrigger className="font-semibold hover:no-underline py-3 text-lg">
              How it works
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Copy-paste the link of a public IG post/reel that has complete
                  event details and/or copy-paste event details directly
                </li>
                <li>
                  Add your email address to be updated about the event status
                </li>
                <li>
                  The post and details will be reviewed then turned into an
                  event on Dance Chives. It will be visible on the calendar and
                  searchable.
                </li>
                <li>
                  Only factual event data and reference links will be added on
                  Dance Chives. No images will be downloaded or displayed.
                </li>
                <li>
                  If this is your event and you would like to add detailed event
                  data including posters, sections, and accurate details{" "}
                  <Link
                    href="/signup"
                    className="text-secondary-light hover:text-primary-light"
                  >
                    sign up
                  </Link>{" "}
                  and use the "Add Event" form.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="rules"
            className="border-b border-primary-light"
          >
            <AccordionTrigger className="font-semibold text-center hover:no-underline py-3 text-lg">
              Rules
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Submissions must have a clear date, time, location, city,
                  style, and title
                </li>
                <li>Submit an IG post/reel URL, event details, or both.</li>
                <li>
                  Only future events that are at least 5 days away are allowed
                  for submission
                </li>
                <li>
                  Only sessions, battles, community classes ($5 or less), and
                  workshops allowed for submission.
                </li>
                <li>Reviews may take up to 48 hours</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
                placeholder="Optional if sending an IG URL.  Please provide: Title, City, Type (Session, Battle, Workshop), Description, Dates, Times, Location, Cost, Prize, Organizer, DJ, etc."
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
                placeholder="If you would like to be updated about the event status"
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
      </div>
    </section>
  );
}
