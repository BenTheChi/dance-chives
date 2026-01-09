import { YouTubeVideoMetadata } from "./youtube-api";

export interface FormContext {
  title?: string;
  eventType?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
  existingSections?: Array<{
    id: string;
    title: string;
    sectionType: string;
    hasBrackets: boolean;
    brackets?: Array<{ id: string; title: string }>;
  }>;
}

export interface ParsedSection {
  id?: string;
  title: string;
  description: string;
  sectionType:
    | "Battle"
    | "Competition"
    | "Performance"
    | "Showcase"
    | "Class"
    | "Session"
    | "Party"
    | "Other";
  hasBrackets: boolean;
  videos: Array<{
    id?: string;
    title: string;
    src: string;
    type: "battle" | "freestyle" | "choreography" | "class" | "other";
    styles?: string[];
  }>;
  brackets: Array<{
    id?: string;
    title: string;
    videos: Array<{
      id?: string;
      title: string;
      src: string;
      type: "battle" | "freestyle" | "choreography" | "class" | "other";
      styles?: string[];
    }>;
  }>;
  styles?: string[];
  applyStylesToVideos?: boolean;
}

export interface ParsedPlaylistResponse {
  sections: ParsedSection[];
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : url;
}

/**
 * Reconstruct full YouTube URL from video ID
 */
export function reconstructUrl(videoId: string): string {
  if (videoId.startsWith("http")) {
    return videoId;
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Remove event title from video titles using regex
 */
export function cleanVideoTitle(
  videoTitle: string,
  eventTitle?: string
): string {
  if (!eventTitle) return videoTitle;

  const eventTitlePattern = eventTitle
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s*[:-]?\\s*");

  const regex = new RegExp(`^${eventTitlePattern}\\s*[:-]?\\s*`, "i");
  return videoTitle.replace(regex, "").trim();
}

/**
 * Build prompt for Task 1: Categorize videos into sections
 */
export function buildCategorizationPrompt(
  videos: YouTubeVideoMetadata[],
  context: FormContext
): string {
  const eventTitle = context.title || "Event";
  const existingSections = context.existingSections || [];

  const videoList = videos
    .map((v) => {
      const videoId = extractVideoId(v.url);
      return `${v.title}|${videoId}`;
    })
    .join("\n");

  const sectionsInfo =
    existingSections.length > 0
      ? `\n\nPROVIDED SECTIONS (use these, do NOT create new ones):
${existingSections
  .map((s) => `- "${s.title}" (type: ${s.sectionType})`)
  .join("\n")}`
      : "\n\nNo sections provided - create sections based on video title patterns.";

  const videoIdList = videos.map((v) => extractVideoId(v.url)).join(", ");

  return `TASK: Categorize ${videos.length} videos into sections.

${sectionsInfo}

Videos (format: Title|VideoID):
${videoList}

STEP-BY-STEP ALGORITHM (follow exactly):
1. Read each line from the video list above
2. For each video, determine which section it belongs to
3. Add the video to that section's videos array
4. Continue until ALL ${videos.length} videos are processed
5. Count total videos in output - MUST equal ${videos.length}
6. Verify each videoId appears exactly once

OUTPUT FORMAT (JSON only):
{
  "sections": [
    {
      "title": "Section Name",
      "sectionType": "Battle|Competition|Performance|Showcase|Class|Session|Party|Other",
      "hasBrackets": boolean,
      "videos": [
        {
          "title": "full title from input",
          "src": "videoId (11 chars, copy exactly from input)",
          "type": "battle|freestyle|choreography|class|other"
        }
      ],
      "description": ""
    }
  ]
}

CRITICAL RULES:
- Copy videoId EXACTLY from input (11 characters)
- Each videoId must appear EXACTLY ONCE in output
- Total video count MUST equal ${videos.length}
- If unsure which section, use "Other"
- Determine video type: "vs"/"battle"→battle, "showcase"/"performance"→choreography, "freestyle"→freestyle, "class"/"workshop"→class, else→other
- hasBrackets: true ONLY for Battle sectionType

Return ONLY valid JSON.`;
}

/**
 * Build prompt for Task 2: Organize battle sections into brackets and clean titles
 */
export function buildBracketOrganizationPrompt(
  section: any,
  sectionIndex: number
): string {
  const videoList = section.videos
    .map((v: any) => `${v.title}|${v.src}`)
    .join("\n");

  return `TASK: Organize battle videos into brackets

Section: "${section.title}"
Input: ${section.videos.length} videos

Videos (format: title|videoId):
${videoList}

STEP-BY-STEP ALGORITHM (follow exactly):
1. Read each line from the video list above
2. Extract bracket name from title (Prelims, Top 8, Finals, etc.)
3. Add video to appropriate bracket
4. Continue until ALL ${section.videos.length} videos are processed
5. Count total videos across all brackets - MUST equal ${section.videos.length}

BRACKET NAMES (extract from titles):
- "Prelims"/"Pre-Selection"/"Preselection" → "Prelims"
- "Top 32"/"Top 16"/"Top 8" -> "Top 32"/"Top 16"/"Top 8"
- "Quarterfinals"/"Quarter Finals" → "Quarterfinals"
- "Semifinals"/"Semi Finals"/ "Top 4" → "Semifinals"
- "Finals"/"Final" → "Finals"
- "7 to Smoke"/"7-to-Smoke" → "7 to Smoke"

OUTPUT FORMAT (JSON only):
{
  "sectionTitle": "${section.title}",
  "brackets": [
    {
      "title": "Bracket Name",
      "videos": [
        {
          "title": "title",
          "src": "videoId (copy exactly from input)",
          "type": "battle"
        }
      ]
    }
  ]
}

CRITICAL RULES:
- Copy videoId EXACTLY from input (11 characters)
- Each videoId must appear EXACTLY ONCE
- Total video count MUST equal ${section.videos.length}

Return ONLY valid JSON.`;
}

/**
 * Build prompt for Task 3: Sanitize all video titles to "X vs Y" format
 */
export function buildTitleSanitizationPrompt(
  parsedResponse: ParsedPlaylistResponse
): string {
  const jsonInput = JSON.stringify(parsedResponse, null, 2);

  return `TASK: Sanitize all video titles by removing redundant information.

Input JSON:
${jsonInput}

STEP-BY-STEP ALGORITHM:
1. For each section, process all videos in the "videos" array
2. For each bracket in each section, process all videos in the bracket's "videos" array
3. For each video title, apply sanitization based on section type:
   
   FOR BATTLE SECTIONS (sectionType === "Battle"):
   - Find "vs" in the title (case insensitive)
   - Extract only the names before and after "vs"
   - Remove ALL other text: event names, dates, volumes, bracket names, round indicators, dance styles, emojis, separators
   - Keep ONLY: "Name1 vs Name2" or "Name1 vs Name2 vs Name3" (for crew battles)
   - Preserve exact name spelling and capitalization
   
   FOR OTHER SECTIONS (Competition, Performance, Showcase, Class, Session, Party, Other):
   - Remove redundant information: event title, section name, dates, emojis, separators
   - Keep the meaningful content: dancer/performer names, performance descriptions
   - Preserve exact name spelling and capitalization

4. Keep all other fields unchanged (src, type, styles, etc.)
5. Keep all structure unchanged (sections, brackets, etc.)

TITLE PARSING EXAMPLES:

BATTLE SECTIONS:
- "Event 2024 - John vs Sarah - Top 8" → "John vs Sarah"
- "🔥 Prelims: Mike vs Alex (Hip Hop)" → "Mike vs Alex"
- "Team A vs Team B | Finals | Breaking" → "Team A vs Team B"
- "Semifinals - Dancer1 vs Dancer2 vs Dancer3" → "Dancer1 vs Dancer2 vs Dancer3"
- "Battle Vol.1: Crew A vs Crew B (Prelims)" → "Crew A vs Crew B"

NON-BATTLE SECTIONS (Performance, Showcase, etc.):
- "Event 2024 - Showcase - Sarah's Solo" → "Sarah's Solo"
- "🔥 Performance: Mike's Choreography (Hip Hop)" → "Mike's Choreography"
- "Festival 2023 | Finals Performance | Team A" → "Team A"
- "Class Demo - John Teaching Popping" → "John Teaching Popping"
- "Event Vol.1: Crew B Performance (Opening)" → "Crew B Performance"

OUTPUT FORMAT:
Return the EXACT same JSON structure with ONLY titles sanitized as specified.
- All other fields remain unchanged
- All structure remains unchanged
- All videoIds remain unchanged
- Only the "title" field in each video object is modified

CRITICAL RULES:
- Do NOT add, remove, or modify any videos
- Do NOT change any videoIds
- Do NOT change structure (sections, brackets, etc.)
- ONLY modify the "title" field according to the section type rules above
- For Battle sections: extract "X vs Y" format
- For other sections: remove redundant info but keep meaningful content

Return ONLY valid JSON.`;
}

/**
 * Auto-fix categorization issues: remove duplicates and add missing videos
 */
export function fixCategorizationIssues(
  categorizedResponse: any,
  inputVideos: YouTubeVideoMetadata[],
  context: FormContext
): any {
  const inputVideoIds = new Set(inputVideos.map((v) => extractVideoId(v.url)));
  const outputVideoIds = new Set<string>();
  const outputVideoIdsList: string[] = [];
  const videoMap = new Map(inputVideos.map((v) => [extractVideoId(v.url), v]));

  categorizedResponse.sections.forEach((section: any) => {
    if (section.videos) {
      section.videos.forEach((video: any) => {
        const videoId = extractVideoId(video.src);
        outputVideoIdsList.push(videoId);
        outputVideoIds.add(videoId);
      });
    }
  });

  const missingIds = Array.from(inputVideoIds).filter(
    (id) => !outputVideoIds.has(id)
  );

  const seenIds = new Set<string>();
  const sectionsToFix: Array<{ sectionIdx: number; videoIdx: number }> = [];

  categorizedResponse.sections.forEach((section: any, sectionIdx: number) => {
    if (section.videos) {
      section.videos.forEach((video: any, videoIdx: number) => {
        const videoId = extractVideoId(video.src);
        if (seenIds.has(videoId)) {
          sectionsToFix.push({ sectionIdx, videoIdx });
        } else {
          seenIds.add(videoId);
        }
      });
    }
  });

  sectionsToFix.reverse().forEach(({ sectionIdx, videoIdx }) => {
    if (categorizedResponse.sections[sectionIdx]?.videos) {
      categorizedResponse.sections[sectionIdx].videos.splice(videoIdx, 1);
      console.log(
        `  🔧 Auto-fixed: Removed duplicate video from section "${categorizedResponse.sections[sectionIdx].title}"`
      );
    }
  });

  if (missingIds.length > 0) {
    let otherSection = categorizedResponse.sections.find(
      (s: any) => s.title === "Other" || s.sectionType === "Other"
    );

    if (!otherSection) {
      otherSection = {
        title: "Other",
        sectionType: "Other",
        hasBrackets: false,
        videos: [],
        description: "",
      };
      categorizedResponse.sections.push(otherSection);
    }

    missingIds.forEach((id) => {
      const video = videoMap.get(id);
      if (video) {
        const cleanedTitle = cleanVideoTitle(video.title, context.title);
        otherSection.videos.push({
          title: cleanedTitle,
          src: id,
          type: "other",
        });
        console.log(
          `  🔧 Auto-fixed: Added missing video "${cleanedTitle}" (${id}) to "Other" section`
        );
      }
    });
  }

  return categorizedResponse;
}

/**
 * Auto-fix bracket organization issues: remove duplicates and add missing videos
 */
export function fixBracketIssues(
  bracketResponse: any,
  sectionVideos: any[],
  sectionTitle: string
): any {
  const inputVideoIds = new Set(
    sectionVideos.map((v: any) => extractVideoId(v.src))
  );
  const outputVideoIds = new Set<string>();
  const outputVideoIdsList: string[] = [];
  const videoMap = new Map(
    sectionVideos.map((v: any) => [extractVideoId(v.src), v])
  );

  if (bracketResponse.brackets) {
    bracketResponse.brackets.forEach((bracket: any) => {
      if (bracket.videos) {
        bracket.videos.forEach((video: any) => {
          const videoId = extractVideoId(video.src);
          outputVideoIdsList.push(videoId);
          outputVideoIds.add(videoId);
        });
      }
    });
  }

  const seenIds = new Set<string>();
  if (bracketResponse.brackets) {
    bracketResponse.brackets.forEach((bracket: any) => {
      if (bracket.videos) {
        const originalLength = bracket.videos.length;
        bracket.videos = bracket.videos.filter((video: any) => {
          const videoId = extractVideoId(video.src);
          if (seenIds.has(videoId)) {
            return false;
          }
          seenIds.add(videoId);
          return true;
        });
        if (bracket.videos.length < originalLength) {
          console.log(
            `  🔧 Auto-fixed: Removed ${
              originalLength - bracket.videos.length
            } duplicate(s) from bracket "${bracket.title}"`
          );
        }
      }
    });
  }

  const missingIds = Array.from(inputVideoIds).filter((id) => !seenIds.has(id));

  if (missingIds.length > 0) {
    let defaultBracket = bracketResponse.brackets?.find(
      (b: any) => b.title === "Battle"
    );

    if (!defaultBracket) {
      defaultBracket = {
        title: "Battle",
        videos: [],
      };
      if (!bracketResponse.brackets) {
        bracketResponse.brackets = [];
      }
      bracketResponse.brackets.push(defaultBracket);
    }

    missingIds.forEach((id) => {
      const video = videoMap.get(id);
      if (video) {
        let cleanedTitle = video.title;
        const vsMatch = cleanedTitle.match(/([^|:]+)\s+vs\s+([^|:]+)/i);
        if (vsMatch) {
          cleanedTitle = `${vsMatch[1].trim()} vs ${vsMatch[2].trim()}`;
        }
        defaultBracket.videos.push({
          title: cleanedTitle,
          src: id,
          type: "battle",
        });
        console.log(
          `  🔧 Auto-fixed: Added missing video "${cleanedTitle}" (${id}) to "Battle" bracket`
        );
      }
    });
  }

  return bracketResponse;
}
