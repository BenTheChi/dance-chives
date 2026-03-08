"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitHomepagePlaylistSubmission } from "@/lib/server_actions/submission_actions";
import {
  initialPlaylistSubmissionFormState,
  type PlaylistSubmissionFormState,
} from "@/lib/submissions/playlist-submission-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Submitting..." : "Submit Playlist"}
    </Button>
  );
}

export function HomePlaylistSubmissionForm() {
  const [state, formAction] = useActionState<
    PlaylistSubmissionFormState,
    FormData
  >(submitHomepagePlaylistSubmission, initialPlaylistSubmissionFormState);

  return (
    <section className="w-full bg-secondary-dark rounded-sm border-4 border-secondary-light p-4 sm:p-6">
      <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
        <h3 className="!text-2xl sm:!text-3xl !font-rubik-mono-one text-outline mb-3 text-center">
          Archive Past Event
        </h3>
        <p className="text-center text-sm sm:text-base mb-6 max-w-2xl">
          Submit a single playlist URL for queue review in Dance Chives console.
          Playlist IDs are permanently deduped.
        </p>
        {state.status === "success" ? (
          <div className="rounded-sm border-2 border-secondary-light bg-charcoal p-4 text-center">
            <p className="!text-lg">{state.message}</p>
            <p className="text-sm mt-2">
              Refresh the page to submit another playlist.
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-4 w-full">
            <div className="space-y-2">
              <label htmlFor="playlistUrl" className="block font-semibold">
                YouTube Playlist URL
              </label>
              <Input
                id="playlistUrl"
                name="playlistUrl"
                type="url"
                required
                placeholder="https://www.youtube.com/playlist?list=..."
              />
            </div>

            {state.status === "error" && (
              <div className="text-red-300 font-semibold" role="alert">
                <p>{state.message}</p>
                {state.eventUrl ? (
                  <p className="mt-2 text-sm font-normal">
                    <Link href={state.eventUrl} className="underline">
                      View existing event
                    </Link>
                  </p>
                ) : null}
              </div>
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
