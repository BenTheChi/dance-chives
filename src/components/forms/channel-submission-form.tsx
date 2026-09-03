"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Check, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitChannel } from "@/lib/server_actions/channel_submission_actions";
import { initialChannelSubmissionState } from "@/lib/submissions/channel-submission-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto shrink-0 font-bold"
    >
      {pending ? "Checking…" : "Submit channel"}
    </Button>
  );
}

/**
 * One field: a YouTube channel URL.
 *
 * This replaces a two-accordion Instagram form that asked for a future event
 * with a clear date, time, location and cost — an organizer-only, future-facing
 * ask, on a site whose content is 100% past footage. It produced 0 submissions.
 *
 * The reframing is the point. "Know a channel we're missing?" is archival and
 * anyone can answer it, including someone who has never run an event. The
 * echo-back of channel name and video count is the whole UX: it proves the
 * submission was understood before the user walks away.
 */
export function ChannelSubmissionForm() {
  const { status: sessionStatus } = useSession();
  const [state, formAction] = useActionState(
    submitChannel,
    initialChannelSubmissionState,
  );

  const isAuthenticated = sessionStatus === "authenticated";

  return (
    <section className="w-full bg-primary rounded-sm border-4 border-primary-light p-4 sm:p-6">
      <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
        <h3 className="!text-2xl sm:!text-3xl !font-rubik-mono-one text-outline mb-2 text-center">
          Know a channel we&apos;re missing?
        </h3>
        <p className="text-center mb-6 max-w-xl">
          Paste a YouTube channel that posts battle footage and we&apos;ll look
          at archiving it.
        </p>

        {state.status === "success" ? (
          <div className="w-full rounded-sm border-2 border-primary-light bg-charcoal p-4">
            <div className="flex items-start gap-3">
              <Check
                aria-hidden="true"
                className="h-5 w-5 mt-0.5 shrink-0 text-primary-light"
              />
              <div className="min-w-0">
                <p className="!text-lg font-bold">{state.message}</p>
                {state.resolved && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {state.resolved.name}
                    {state.resolved.videoCount !== undefined &&
                      ` · ${state.resolved.videoCount.toLocaleString()} videos`}
                    {state.resolved.alreadyArchived
                      ? " · already archived"
                      : " · not yet archived"}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : isAuthenticated ? (
          <form action={formAction} className="w-full">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Youtube
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                />
                <Input
                  id="channelUrl"
                  name="channelUrl"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="youtube.com/@channelname"
                  aria-label="YouTube channel URL"
                  className="pl-10 h-11"
                />
              </div>
              <SubmitButton />
            </div>

            {state.status === "error" && (
              <p className="text-red-300 font-semibold mt-3" role="alert">
                {state.message}
              </p>
            )}
          </form>
        ) : (
          // Membership is the bar for every write on the site, so the form is
          // not shown to a signed-out visitor at all — an input that rejects
          // you after you have typed into it is worse than one that says up
          // front what it needs.
          <div className="w-full rounded-sm border-2 border-dashed border-primary-light/60 p-6 text-center">
            <p className="mb-4">Sign in to suggest a channel.</p>
            <Link href="/login">
              <Button className="font-bold">Sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
