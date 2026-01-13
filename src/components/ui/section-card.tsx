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
  city?: string;
}

// Section type color palette with opacity values for background tint
const SECTION_TYPE_COLORS: Record<
  Section["sectionType"],
  { bg: string; text: string }
> = {
  Battle: {
    bg: "rgba(247, 147, 30, 0.85)",
    text: "white",
  },
  Competition: { bg: "rgba(255, 232, 29, 0.8)", text: "white" },
  Performance: { bg: "rgba(74, 144, 226, 0.85)", text: "white" },
  Showcase: { bg: "rgba(123, 104, 238, 0.85)", text: "white" },
  Class: { bg: "rgba(80, 200, 120, 0.85)", text: "white" },
  Session: { bg: "rgba(0, 206, 209, 0.85)", text: "white" },
  Party: { bg: "rgba(255, 20, 147, 0.85)", text: "white" },
  Other: { bg: "rgba(112, 128, 144, 0.85)", text: "white" },
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const hasSectionDateTime = (
  section: SectionCardProps["section"]
): section is Section & {
  date?: string;
  startTime?: string;
  endTime?: string;
} => "date" in section;

export function SectionCard({
  section,
  eventId,
  eventTitle,
  showEventTitle = false,
  city,
}: SectionCardProps) {
  const sectionId = section.id;
  const sectionTitle = section.title;
  const sectionType = section.sectionType || "Other";
  const sectionWithDate = hasSectionDateTime(section) ? section : undefined;
  const formattedStart = sectionWithDate?.startTime
    ? formatTime(sectionWithDate.startTime)
    : null;
  const formattedEnd = sectionWithDate?.endTime
    ? formatTime(sectionWithDate.endTime)
    : null;

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
  const dateTimeText =
    sectionWithDate && sectionWithDate.date && formattedStart && formattedEnd
      ? `${sectionWithDate.date} • ${formattedStart} - ${formattedEnd}`
      : null;

  return (
    <div
      className="section-card h-[225px] cursor-pointer overflow-hidden relative bg-secondary"
      style={{ borderColor: sectionColor.bg }}
    >
      <Link
        href={`/events/${eventId}/sections/${sectionId}`}
        prefetch={false}
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
              <span className="text-sm font-bold text-accent-yellow">
                {totalVideoCount} {totalVideoCount === 1 ? "video" : "videos"}
              </span>
            )}
          </div>

          {/* Event title - shown only when showEventTitle is true - more prominent */}
          {showEventTitle && eventTitle && (
            <>
              <h2 className="text-center my-2">{eventTitle}</h2>
              {dateTimeText && (
                <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                  {dateTimeText}
                </p>
              )}
            </>
          )}

          <div className="flex-1 flex flex-col items-center ">
            {/* Section title - smaller when event title is shown */}
            <h3
              className={`line-clamp-2  ${
                showEventTitle ? "text-base mb-2" : "text-lg mb-3"
              }`}
            >
              {sectionTitle}
            </h3>

            {/* City name - shown under section title */}
            {city && (
              <p className="text-center !text-sm text-muted-foreground mb-2">
                {city}
              </p>
            )}

            {!showEventTitle && dateTimeText && (
              <p className="text-center !text-[12px] uppercase tracking-[0.08em] mb-1">
                {dateTimeText}
              </p>
            )}
          </div>

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
