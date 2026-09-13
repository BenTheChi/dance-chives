/**
 * Form state for the YouTube channel submission.
 *
 * `resolved` is what makes the form work as a UX: echoing the channel's name
 * and video count back proves the submission was understood before the user
 * walks away. It is optional because it depends on a YouTube API key being
 * configured — without one the submission is still accepted, just not echoed.
 */
export interface ResolvedChannel {
  name: string;
  videoCount?: number;
  alreadyArchived: boolean;
}

export interface ChannelSubmissionFormState {
  status: "idle" | "success" | "error";
  message: string;
  resolved?: ResolvedChannel;
}

/**
 * Wording shared by every "we already know about this one" answer.
 *
 * Deliberately identical whether the channel is archived, already queued, or
 * was rejected: telling a stranger their suggestion was turned down invites
 * argument and leaks an editorial judgement, and the three cases are
 * indistinguishable from outside anyway.
 */
export const ALREADY_KNOWN_MESSAGE =
  "Thanks — we've already got this one on our radar.";

export const initialChannelSubmissionState: ChannelSubmissionFormState = {
  status: "idle",
  message: "",
};
