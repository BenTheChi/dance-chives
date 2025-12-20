import { Section } from "@/types/event";
import { Video } from "@/types/video";

export type SectionType = Section["sectionType"];
export type VideoType = Video["type"];

export const sectionTypeSupportsWinners = (sectionType?: string): boolean =>
  ["Battle", "Tournament", "Competition"].includes(sectionType || "");

export const sectionTypeSupportsJudges = (sectionType?: string): boolean =>
  ["Battle", "Tournament", "Competition"].includes(sectionType || "");

export const sectionTypeRequiresBrackets = (sectionType?: string): boolean =>
  ["Battle", "Tournament"].includes(sectionType || "");

export const sectionTypeDisallowsBrackets = (sectionType?: string): boolean =>
  ["Showcase", "Class", "Session", "Performance"].includes(sectionType || "");

export const getDefaultVideoType = (sectionType?: string): VideoType => {
  switch (sectionType) {
    case "Battle":
      return "battle";
    case "Competition":
    case "Performance":
      return "choreography";
    case "Showcase":
    case "Session":
      return "freestyle";
    case "Class":
      return "class";
    default:
      return "battle";
  }
};

export function updateSectionType(
  sections: Section[],
  sectionId: string,
  newType: SectionType | undefined
): Section[] {
  return sections.map((section) => {
    if (section.id !== sectionId) return section;

    const requiresBrackets = sectionTypeRequiresBrackets(newType);
    const disallowsBrackets = sectionTypeDisallowsBrackets(newType);
    const supportsWinners = sectionTypeSupportsWinners(newType);
    const supportsJudges = sectionTypeSupportsJudges(newType);
    const defaultVideoType = getDefaultVideoType(newType);

    const winners = supportsWinners ? section.winners || [] : [];
    const judges = supportsJudges ? section.judges || [] : [];

    const hasBrackets = requiresBrackets
      ? true
      : disallowsBrackets
      ? false
      : section.hasBrackets;

    const shouldKeepBrackets =
      requiresBrackets || (hasBrackets && !disallowsBrackets);

    const videosFromBrackets =
      disallowsBrackets && section.brackets.length > 0
        ? section.brackets.flatMap((bracket) =>
            bracket.videos.map((video) => ({
              ...video,
              type: defaultVideoType,
            }))
          )
        : [];

    const updatedBrackets = shouldKeepBrackets
      ? section.brackets.map((bracket) => ({
          ...bracket,
          videos: bracket.videos.map((video) => ({
            ...video,
            type: defaultVideoType,
          })),
        }))
      : [];

    const updatedVideos = [
      ...section.videos.map((video) => ({
        ...video,
        type: defaultVideoType,
      })),
      ...videosFromBrackets,
    ];

    return {
      ...section,
      sectionType: (newType || "Battle") as Section["sectionType"],
      hasBrackets,
      winners,
      judges,
      videos: updatedVideos,
      brackets: updatedBrackets,
    };
  });
}

type UpdateVideoTypeParams = {
  sectionId: string;
  videoId: string;
  context: "section" | "bracket";
  bracketId?: string;
};

export function updateVideoTypeForId(
  sections: Section[],
  { sectionId, videoId, context, bracketId }: UpdateVideoTypeParams,
  type: VideoType
): Section[] {
  return sections.map((section) => {
    if (section.id !== sectionId) return section;

    if (context === "section") {
      return {
        ...section,
        videos: section.videos.map((v) =>
          v.id === videoId ? { ...v, type } : v
        ),
      };
    }

    return {
      ...section,
      brackets: section.brackets.map((bracket) =>
        bracket.id === bracketId
          ? {
              ...bracket,
              videos: bracket.videos.map((v) =>
                v.id === videoId ? { ...v, type } : v
              ),
            }
          : bracket
      ),
    };
  });
}
