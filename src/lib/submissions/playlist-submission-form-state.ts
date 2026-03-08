export type PlaylistSubmissionFormState = {
  status: "idle" | "success" | "error";
  message: string;
  eventUrl: string | null;
};

export const initialPlaylistSubmissionFormState: PlaylistSubmissionFormState = {
  status: "idle",
  message: "",
  eventUrl: null,
};
