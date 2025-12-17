import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import NextImage from "next/image";
import { StyleBadge } from "@/components/ui/style-badge";
import { Section, Video, Bracket } from "@/types/event";
import { Image } from "@/types/image";

interface SectionCardProps {
  section:
    | Section
    | {
        id: string;
        title: string;
        sectionType?: Section["sectionType"];
        poster?: Image | { url?: string } | null;
        videos?: Video[];
        brackets?: Bracket[];
        styles?: string[];
        applyStylesToVideos?: boolean;
      };
  eventId: string;
  eventTitle?: string;
}

export function SectionCard({
  section,
  eventId,
  eventTitle,
}: SectionCardProps) {
  // Handle different section data structures
  const sectionId = section.id;
  const sectionTitle = section.title;
  const sectionType = section.sectionType;

  // Handle poster - can be Image object, object with url, or string url
  const posterUrl = section.poster
    ? typeof section.poster === "string"
      ? section.poster
      : "url" in section.poster
      ? section.poster.url
      : null
    : null;

  const posterTitle =
    section.poster &&
    typeof section.poster === "object" &&
    "title" in section.poster
      ? section.poster.title
      : undefined;

  // Calculate total video count (if videos/brackets are available)
  const videos = section.videos || [];
  const brackets = section.brackets || [];
  const directVideoCount = videos.length;
  const bracketVideoCount = brackets.reduce(
    (sum: number, bracket: Bracket) => sum + (bracket.videos?.length || 0),
    0
  );
  const totalVideoCount = directVideoCount + bracketVideoCount;

  // Get styles - either from section.styles or aggregated from videos
  let displayStyles: string[] = [];
  if (
    section.applyStylesToVideos &&
    section.styles &&
    section.styles.length > 0
  ) {
    displayStyles = section.styles;
  } else if (!section.applyStylesToVideos && videos.length > 0) {
    const videoStyles = new Set<string>();
    videos.forEach((video: Video) => {
      if (video.styles) {
        video.styles.forEach((style: string) => videoStyles.add(style));
      }
    });
    brackets.forEach((bracket: Bracket) => {
      bracket.videos?.forEach((video: Video) => {
        if (video.styles) {
          video.styles.forEach((style: string) => videoStyles.add(style));
        }
      });
    });
    displayStyles = Array.from(videoStyles);
  }

  return (
    <div className="w-full max-w-[500px] min-[1180px]:max-w-[1020px] min-w-[300px] bg-periwinkle rounded-sm border border-black cursor-pointer hover:shadow-lg/100 overflow-hidden">
      <Link
        href={`/events/${eventId}/sections/${sectionId}`}
        className="block h-full"
      >
        <div className="flex h-full">
          {/* Poster on left - max 500px width, square aspect */}
          <div className="relative min-w-[200px] min-[1180px]:min-w-[500px] aspect-square border-r border-black shrink-0 rounded-l-lg">
            {posterUrl ? (
              <NextImage
                src={posterUrl}
                alt={posterTitle || sectionTitle}
                fill
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No poster</span>
              </div>
            )}
          </div>

          {/* Content on right - expands as needed */}
          <div className="flex flex-col justify-between p-3 sm:p-4 flex-1 min-w-0">
            <div className="flex flex-col gap-4">
              {/* Section type badge in top right */}
              {sectionType && (
                <span className="text-sm text-gray-600 self-end">
                  {sectionType}
                </span>
              )}

              <div className="flex flex-col items-center">
                {/* Title */}
                <h3 className="font-bold text-lg">{sectionTitle}</h3>

                {/* Video count - only show if we have video data */}
                {totalVideoCount > 0 && (
                  <span className="text-sm text-gray-600 b">
                    {totalVideoCount}{" "}
                    {totalVideoCount === 1 ? "Video" : "Videos"}
                  </span>
                )}
              </div>
            </div>
            {/* Style tags */}
            {displayStyles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 justify-self-end justify-center">
                {displayStyles.map((style: string) => (
                  <StyleBadge key={style} style={style} asLink={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
