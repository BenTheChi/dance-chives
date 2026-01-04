import Link from "next/link";
import { StyleBadge } from "@/components/ui/style-badge";
import { Section, Video, Bracket } from "@/types/event";

interface SectionCardProps {
  section:
    | Section
    | {
        id: string;
        title: string;
        sectionType?: Section["sectionType"];
        poster?: any;
        videos?: Video[];
        brackets?: Bracket[];
        styles?: string[];
        applyStylesToVideos?: boolean;
      };
  eventId: string;
  eventTitle?: string;
  showEventTitle?: boolean;
}

// Section type color palette with opacity values for background tint
const SECTION_TYPE_COLORS: Record<
  Section["sectionType"],
  { bg: string; text: string }
> = {
  Battle: { bg: "rgba(255, 82, 82, 0.25)", text: "#FF5252" },
  Tournament: { bg: "rgba(255, 107, 53, 0.25)", text: "#FF6B35" },
  Competition: { bg: "rgba(247, 147, 30, 0.25)", text: "#F7931E" },
  Performance: { bg: "rgba(74, 144, 226, 0.25)", text: "#4A90E2" },
  Showcase: { bg: "rgba(123, 104, 238, 0.25)", text: "#7B68EE" },
  Class: { bg: "rgba(80, 200, 120, 0.25)", text: "#50C878" },
  Session: { bg: "rgba(0, 206, 209, 0.25)", text: "#00CED1" },
  Mixed: { bg: "rgba(147, 112, 219, 0.25)", text: "#9370DB" },
  Other: { bg: "rgba(112, 128, 144, 0.25)", text: "#708090" },
};

export function SectionCard({
  section,
  eventId,
  eventTitle,
  showEventTitle = false,
}: SectionCardProps) {
  const sectionId = section.id;
  const sectionTitle = section.title;
  const sectionType = section.sectionType || "Other";

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

  // Helper function to aggregate styles from videos
  const aggregateVideoStyles = () => {
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
    return Array.from(videoStyles);
  };

  if (section.applyStylesToVideos === true) {
    // When explicitly true, use section styles
    if (section.styles && section.styles.length > 0) {
      displayStyles = section.styles;
    }
  } else if (section.applyStylesToVideos === false) {
    // When explicitly false, aggregate from videos
    displayStyles = aggregateVideoStyles();
  } else {
    // When undefined, prefer section styles if available, otherwise use video styles
    if (section.styles && section.styles.length > 0) {
      displayStyles = section.styles;
    } else {
      displayStyles = aggregateVideoStyles();
    }
  }

  // Limit to 4 visible badges, show "+X more" for overflow
  const maxVisibleBadges = 4;
  const visibleStyles = displayStyles.slice(0, maxVisibleBadges);
  const remainingCount = displayStyles.length - maxVisibleBadges;

  const sectionColor = SECTION_TYPE_COLORS[sectionType];

  return (
    <div
      className="section-card h-[180px] bg-secondary-dark cursor-pointer overflow-hidden relative"
      style={{ backgroundColor: sectionColor.bg }}
    >
      <Link
        href={`/events/${eventId}/sections/${sectionId}`}
        className="block h-full"
      >
        <div className="flex flex-col h-full p-4">
          {/* Header row: section type + video count */}
          <div className="flex justify-between items-center mb-2">
            <span
              className="font-semibold text-sm"
              style={{ color: sectionColor.text }}
            >
              {sectionType}
            </span>
            {totalVideoCount > 0 && (
              <span className="text-sm text-accent-yellow">
                {totalVideoCount} {totalVideoCount === 1 ? "video" : "videos"}
              </span>
            )}
          </div>

          {/* Event title - shown only when showEventTitle is true - more prominent */}
          {showEventTitle && eventTitle && (
            <h2
              className="text-xl font-rubik-mono-one text-center mb-2"
              style={{ wordSpacing: "-4px" }}
            >
              {eventTitle}
            </h2>
          )}

          {/* Section title - smaller when event title is shown */}
          <h3
            className={`font-rubik-mono-one text-center line-clamp-2 flex-1 flex items-center justify-center ${
              showEventTitle ? "text-base mb-2" : "text-lg mb-3"
            }`}
            style={{ wordSpacing: "-4px" }}
          >
            {sectionTitle}
          </h3>

          {/* Large style badges row */}
          {displayStyles.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {visibleStyles.map((style: string) => (
                <StyleBadge
                  key={style}
                  style={style}
                  asLink={false}
                  className="text-sm px-3 py-1.5 rounded-full"
                />
              ))}
              {remainingCount > 0 && (
                <span className="text-sm px-3 py-1.5 bg-fog-white border border-charcoal rounded-full text-black font-semibold">
                  +{remainingCount} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
