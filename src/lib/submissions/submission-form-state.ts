export type SubmissionFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialSubmissionFormState: SubmissionFormState = {
  status: "idle",
  message: "",
};
