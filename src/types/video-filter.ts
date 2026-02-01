export type VideoFilters = {
  yearFrom?: number;
  yearTo?: number;
  cities?: string[];
  styles?: string[];
  finalsOnly?: boolean;
  noPrelims?: boolean;
  sortOrder?: "desc" | "asc";
};

export const DEFAULT_VIDEO_FILTERS: VideoFilters = {
  sortOrder: "desc",
};
