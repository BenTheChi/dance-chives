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

export const initialChannelSubmissionState: ChannelSubmissionFormState = {
  status: "idle",
  message: "",
};
