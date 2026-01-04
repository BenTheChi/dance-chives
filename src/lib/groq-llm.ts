/**
 * Groq Compound Mini LLM client for parsing YouTube playlists into structured event sections
 */

import { DANCE_STYLES } from "./utils/dance-styles";
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
  id?: string; // Optional - will be generated if not provided
  title: string;
  description: string;
  sectionType:
    | "Battle"
    | "Tournament"
    | "Competition"
    | "Performance"
    | "Showcase"
    | "Class"
    | "Session"
    | "Mixed"
    | "Other";
  hasBrackets: boolean;
  videos: Array<{
    id?: string; // Optional - will be generated if not provided
    title: string;
    src: string;
    type: "battle" | "freestyle" | "choreography" | "class" | "other";
    styles?: string[];
  }>;
  brackets: Array<{
    id?: string; // Optional - will be generated if not provided
    title: string;
    videos: Array<{
      id?: string; // Optional - will be generated if not provided
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

interface TrainingExample {
  input: {
    videos: YouTubeVideoMetadata[];
    context: FormContext;
  };
  output: ParsedPlaylistResponse;
}

/**
 * Training examples for the LLM
 */
const TRAINING_EXAMPLES: TrainingExample[] = [
  {
    input: {
      videos: [
        {
          videoId: "iBpQmMizxnE",
          title:
            "Waack, Crackle, Lock! III Top 8: Nana/Nightstorm v. Trouble/Danzel",
          description: "",
          url: "https://www.youtube.com/watch?v=iBpQmMizxnE",
          thumbnailUrl: "https://i.ytimg.com/vi/iBpQmMizxnE/hqdefault.jpg",
          publishedAt: "2022-10-06T05:50:13Z",
        },
        {
          videoId: "rwMfQa9Cz7o",
          title:
            "Waack, Crackle, Lock! III Top 8: Mad Ant/Heartbreaker v. Lockstatic/Char",
          description: "",
          url: "https://www.youtube.com/watch?v=rwMfQa9Cz7o",
          thumbnailUrl: "https://i.ytimg.com/vi/rwMfQa9Cz7o/hqdefault.jpg",
          publishedAt: "2022-10-06T05:51:15Z",
        },
        {
          videoId: "8djmfQ8aaeA",
          title:
            "Waack, Crackle, Lock! III Top 8:  Adobolock/Xone vs  Soul Arch/Tori Cristi",
          description: "",
          url: "https://www.youtube.com/watch?v=8djmfQ8aaeA",
          thumbnailUrl: "https://i.ytimg.com/vi/8djmfQ8aaeA/hqdefault.jpg",
          publishedAt: "2022-10-06T05:52:24Z",
        },
        {
          videoId: "CzGvRuoUeyI",
          title:
            "Waack, Crackle, Lock! III Top 8:  Zuce/Arsenal vs C-Lay/G-Funk",
          description: "",
          url: "https://www.youtube.com/watch?v=CzGvRuoUeyI",
          thumbnailUrl: "https://i.ytimg.com/vi/CzGvRuoUeyI/hqdefault.jpg",
          publishedAt: "2022-10-06T05:53:39Z",
        },
        {
          videoId: "Nytm2lAfDZg",
          title:
            "Title: Waack, Crackle, Lock! III Top 4: C-Lay/G-Funk v. Trouble/Danzel",
          description: "",
          url: "https://www.youtube.com/watch?v=Nytm2lAfDZg",
          thumbnailUrl: "https://i.ytimg.com/vi/Nytm2lAfDZg/hqdefault.jpg",
          publishedAt: "2022-10-06T05:54:19Z",
        },
        {
          videoId: "MC6OqKCmdgo",
          title:
            "Waack, Crackle, Lock! III Top 4: Mad Ant/Heartbreaker v. Soul Arch/Tori Cristi",
          description: "",
          url: "https://www.youtube.com/watch?v=MC6OqKCmdgo",
          thumbnailUrl: "https://i.ytimg.com/vi/MC6OqKCmdgo/hqdefault.jpg",
          publishedAt: "2022-10-06T05:55:04Z",
        },
        {
          videoId: "89Axhl1HoRQ",
          title:
            "Waack, Crackle, Lock! III Finals: Soul Arch/Tori Cristi v. Trouble/Danzel",
          description: "",
          url: "https://www.youtube.com/watch?v=89Axhl1HoRQ",
          thumbnailUrl: "https://i.ytimg.com/vi/89Axhl1HoRQ/hqdefault.jpg",
          publishedAt: "2022-10-06T05:55:52Z",
        },
        {
          videoId: "7tBfRFzAhoQ",
          title: "Waack, Crackle, Lock! III: Rookie Waacking 7-to-Smoke",
          description: "",
          url: "https://www.youtube.com/watch?v=7tBfRFzAhoQ",
          thumbnailUrl: "https://i.ytimg.com/vi/7tBfRFzAhoQ/hqdefault.jpg",
          publishedAt: "2022-10-06T05:56:55Z",
        },
        {
          videoId: "uebupH-w7N0",
          title: "Title: Waack, Crackle, Lock! III: Rookie Locking 7-to-Smoke",
          description: "",
          url: "https://www.youtube.com/watch?v=uebupH-w7N0",
          thumbnailUrl: "https://i.ytimg.com/vi/uebupH-w7N0/hqdefault.jpg",
          publishedAt: "2022-10-06T05:57:56Z",
        },
        {
          videoId: "G1VjxLg76l0",
          title: "Waack, Crackle, Lock! III: 2v2 Locking Prelims",
          description: "",
          url: "https://www.youtube.com/watch?v=G1VjxLg76l0",
          thumbnailUrl: "https://i.ytimg.com/vi/G1VjxLg76l0/hqdefault.jpg",
          publishedAt: "2022-10-06T05:58:36Z",
        },
        {
          videoId: "4WMUpKsz7mg",
          title: "Waack, Crackle, Lock! III: 2v2 Waacking Prelims Group",
          description: "",
          url: "https://www.youtube.com/watch?v=4WMUpKsz7mg",
          thumbnailUrl: "https://i.ytimg.com/vi/4WMUpKsz7mg/hqdefault.jpg",
          publishedAt: "2022-10-06T05:59:04Z",
        },
        {
          videoId: "k2LjXAKvGR8",
          title:
            "Waack, Crackle, Lock! III Judge Showcase: Tracey Wong (Seattle)",
          description: "",
          url: "https://www.youtube.com/watch?v=k2LjXAKvGR8",
          thumbnailUrl: "https://i.ytimg.com/vi/k2LjXAKvGR8/hqdefault.jpg",
          publishedAt: "2022-10-06T05:59:54Z",
        },
        {
          videoId: "nBJ8Gynf3kc",
          title:
            "Title: Waack, Crackle, Lock! III Judge Showcase: Riot (Philadelphia)",
          description: "",
          url: "https://www.youtube.com/watch?v=nBJ8Gynf3kc",
          thumbnailUrl: "https://i.ytimg.com/vi/nBJ8Gynf3kc/hqdefault.jpg",
          publishedAt: "2022-10-06T06:01:12Z",
        },
        {
          videoId: "qvkx_qK_X-Q",
          title: "Waack, Crackle, Lock! III Judge Showcase: Jaypee (Bay Area)",
          description: "",
          url: "https://www.youtube.com/watch?v=qvkx_qK_X-Q",
          thumbnailUrl: "https://i.ytimg.com/vi/qvkx_qK_X-Q/hqdefault.jpg",
          publishedAt: "2022-10-06T06:01:46Z",
        },
        {
          videoId: "8xcqYBryne8",
          title: "Waack, Crackle, Lock! III Judge Showcase: Weezy (Nashville)",
          description: "",
          url: "https://www.youtube.com/watch?v=8xcqYBryne8",
          thumbnailUrl: "https://i.ytimg.com/vi/8xcqYBryne8/hqdefault.jpg",
          publishedAt: "2022-10-06T06:02:38Z",
        },
        {
          videoId: "0stAGwBnKKw",
          title: "Waack, Crackle, Lock! III Performance: Soulful Sundays LA",
          description: "",
          url: "https://www.youtube.com/watch?v=0stAGwBnKKw",
          thumbnailUrl: "https://i.ytimg.com/vi/0stAGwBnKKw/hqdefault.jpg",
          publishedAt: "2022-10-06T06:03:30Z",
        },
        {
          videoId: "lGasMyo_0lc",
          title: "Waack, Crackle, Lock! III Performance: Divine Instinct",
          description: "",
          url: "https://www.youtube.com/watch?v=lGasMyo_0lc",
          thumbnailUrl: "https://i.ytimg.com/vi/lGasMyo_0lc/hqdefault.jpg",
          publishedAt: "2022-10-06T06:04:22Z",
        },
      ],
      context: {
        title: "",
        eventType: "Battle",
        socialLinks: {},
        existingSections: [],
      },
    },
    output: {
      sections: [
        {
          title: "2v2 Locking Waacking",
          description: "",
          sectionType: "Battle",
          hasBrackets: true,
          videos: [],
          brackets: [
            {
              title: "Prelims",
              videos: [
                {
                  title: "2v2 Locking Prelims",
                  src: "https://www.youtube.com/watch?v=G1VjxLg76l0",
                  type: "battle",
                  styles: ["Locking"],
                },
                {
                  title: "2v2 Waacking Prelims",
                  src: "https://www.youtube.com/watch?v=4WMUpKsz7mg",
                  type: "battle",
                  styles: ["Waacking"],
                },
              ],
            },
            {
              title: "Top 8",
              videos: [
                {
                  title: "Nana/Nightstorm v. Trouble/Danzel",
                  src: "https://www.youtube.com/watch?v=iBpQmMizxnE",
                  type: "battle",
                },
                {
                  title: "Mad Ant/Heartbreaker v. Lockstatic/Char",
                  src: "https://www.youtube.com/watch?v=rwMfQa9Cz7o",
                  type: "battle",
                },
                {
                  title: "Adobolock/Xone vs Soul Arch/Tori Cristi",
                  src: "https://www.youtube.com/watch?v=8djmfQ8aaeA",
                  type: "battle",
                },
                {
                  title: "Zuce/Arsenal vs C-Lay/G-Funk",
                  src: "https://www.youtube.com/watch?v=CzGvRuoUeyI",
                  type: "battle",
                },
              ],
            },
            {
              title: "Top 4",
              videos: [
                {
                  title: "C-Lay/G-Funk v. Trouble/Danzel",
                  src: "https://www.youtube.com/watch?v=Nytm2lAfDZg",
                  type: "battle",
                },
                {
                  title: "Mad Ant/Heartbreaker v. Soul Arch/Tori Cristi",
                  src: "https://www.youtube.com/watch?v=MC6OqKCmdgo",
                  type: "battle",
                },
              ],
            },
            {
              title: "Finals",
              videos: [
                {
                  title: "Soul Arch/Tori Cristi v. Trouble/Danzel",
                  src: "https://www.youtube.com/watch?v=89Axhl1HoRQ",
                  type: "battle",
                },
              ],
            },
          ],
          styles: ["Locking"],
          applyStylesToVideos: true,
        },
        {
          title: "Rookie 7-to-Smokes",
          description: "",
          sectionType: "Battle",
          hasBrackets: false,
          videos: [
            {
              title: "Rookie Waacking 7-to-Smoke",
              src: "https://www.youtube.com/watch?v=7tBfRFzAhoQ",
              type: "battle",
              styles: ["Waacking"],
            },
            {
              title: "Rookie Locking 7-to-Smoke",
              src: "https://www.youtube.com/watch?v=uebupH-w7N0",
              type: "battle",
              styles: ["Locking"],
            },
          ],
          brackets: [],
          applyStylesToVideos: true,
        },
        {
          title: "Judge Showcases",
          description: "",
          sectionType: "Showcase",
          hasBrackets: false,
          videos: [
            {
              title: "Tracey Wong (Seattle) Judge Showcase",
              src: "https://www.youtube.com/watch?v=k2LjXAKvGR8",
              type: "choreography",
            },
            {
              title: "Riot (Philadelphia) Judge Showcase",
              src: "https://www.youtube.com/watch?v=nBJ8Gynf3kc",
              type: "choreography",
            },
            {
              title: "Jaypee (Bay Area) Judge Showcase",
              src: "https://www.youtube.com/watch?v=qvkx_qK_X-Q",
              type: "choreography",
            },
            {
              title: "Weezy (Nashville) Judge Showcase",
              src: "https://www.youtube.com/watch?v=8xcqYBryne8",
              type: "choreography",
            },
          ],
          brackets: [],
        },
        {
          title: "Performances",
          description: "",
          sectionType: "Performance",
          hasBrackets: false,
          videos: [
            {
              title: "Soulful Sundays LA Performance",
              src: "https://www.youtube.com/watch?v=0stAGwBnKKw",
              type: "choreography",
            },
            {
              title: "Divine Instinct Performance",
              src: "https://www.youtube.com/watch?v=lGasMyo_0lc",
              type: "choreography",
            },
          ],
          brackets: [],
        },
      ],
    },
  },
];

/**
 * Build comprehensive prompt for Groq LLM to parse playlist into sections
 */
function buildPrompt(
  videos: YouTubeVideoMetadata[],
  context: FormContext
): string {
  const eventTitle = context.title || "Event";
  const eventType = context.eventType || "Battle";
  const existingSections = context.existingSections || [];

  const videoList = videos
    .map((v, i) => `${i + 1}. "${v.title}" - ${v.url}`)
    .join("\n");

  const existingSectionsInfo =
    existingSections.length > 0
      ? `\n\nEXISTING SECTIONS (prioritize sorting videos into these first):\n${existingSections
          .map(
            (s) =>
              `- ${s.title} (${s.sectionType}, ${
                s.hasBrackets ? "has brackets" : "no brackets"
              }${
                s.brackets && s.brackets.length > 0
                  ? `, brackets: ${s.brackets.map((b) => b.title).join(", ")}`
                  : ""
              })`
          )
          .join("\n")}`
      : "";

  return `You are an expert at analyzing dance event YouTube playlists and organizing them into structured sections, brackets, and videos.

EVENT CONTEXT:
- Event Title: "${eventTitle}"
- Event Type: ${eventType}
- Number of Videos: ${videos.length}

VIDEOS IN PLAYLIST:
${videoList}
${existingSectionsInfo}

YOUR TASK:
Parse this playlist and organize videos into sections, brackets, and individual video entries. Return ONLY valid JSON matching the exact schema below.

⚠️⚠️⚠️ CRITICAL FIRST STEP: Before creating any sections, READ THROUGH ALL THE VIDEO TITLES ABOVE carefully. Identify what keywords, formats, and patterns are ACTUALLY PRESENT in the titles. Make a mental list of what you see (e.g., "I see Top 8, Top 4, Finals", "I see Judge Showcase", "I see Performance"). Note: There are ${
    videos.length
  } videos total that must ALL be placed somewhere. ⚠️⚠️⚠️

⚠️⚠️⚠️ CRITICAL SECOND STEP: ONLY create sections based on patterns that ACTUALLY EXIST in the video titles above. DO NOT create sections for patterns you don't see in the actual titles. Examples:
- If you don't see "7-to-smoke" or "7 to smoke" in ANY video title → DO NOT create a "7 to Smoke" section
- If you don't see "2v2" in ANY video title → DO NOT create a "2v2" section  
- If you don't see "Prelims" in ANY video title → DO NOT create a "Prelims" bracket
- Only use what is explicitly written in the video titles above ⚠️⚠️⚠️

⚠️⚠️⚠️ CRITICAL THIRD STEP: EVERY SINGLE VIDEO MUST BE PLACED SOMEWHERE. You must account for all ${
    videos.length
  } videos. After organizing, verify that every video URL from the input appears exactly once in your output. Do not skip, omit, or lose any videos. ⚠️⚠️⚠️

SECTION NAMING RULES:
1. BATTLES: Name sections based on format and style (e.g., "2v2 Breaking", "1v1 Popping", "Crew vs Crew Waacking")
   - ⚠️ CRITICAL: ONLY extract battle format if it's explicitly mentioned in the video titles (e.g., "1v1", "2v2", "3v3", "crew vs crew")
   - Look for "v" or "vs" in titles to identify battles
   - Extract dance style ONLY if mentioned in titles to one or a few of the following: ${DANCE_STYLES.join(
     ", "
   )}
   - If multiple conflicting styles mentioned, leave style off
   - LOTTERY/MIXED STYLE BATTLES: If you see prelim/pre-selection videos with different styles (e.g., "2v2 Locking Prelims" and "2v2 Waacking Prelims", or "2v2 Locking Pre-Selection" and "2v2 Waacking Pre-Selection") AND later brackets (Top 8, Top 4, Finals) that mix styles together, this indicates a lottery-style battle where different styles are paired up
   - In lottery-style battles: Group ALL prelim/pre-selection videos (even with different styles) into ONE "Prelims" or "Pre-Selection" bracket within a single section (e.g., "2v2 Locking Waacking")
   - In standard battles: Each style typically has its own section with its own prelims/pre-selection bracket
   - Key indicator: If Top 8/Finals videos show mixed styles (e.g., "Locking vs Waacking"), it's a lottery battle - group prelims/pre-selections together
   - Key indicator: If Top 8/Finals videos are all the same style, prelims/pre-selections should be separate sections
   - NOTE: "Pre-Selection", "Pre-Selections", and variations are treated EXACTLY the same as "Prelims" and "Preliminary"
   - ⚠️ 7-TO-SMOKE BATTLES: ONLY create a "7 to Smoke" section IF you actually see "7 to smoke", "7-to-smoke", "7-to-Smoke", or similar variations EXPLICITLY written in the video titles above
   - ⚠️ If there are NO videos with "7 to smoke" in their titles, DO NOT create a 7 to Smoke section
   - For 7-to-smoke sections (ONLY when they exist): Set hasBrackets: true, create ONE bracket called "7 to Smoke", and put ALL 7-to-smoke videos in that bracket (regardless of style)

2. SHOWCASES: Name as "Judge Showcases" or "Showcases"
   - Look for words "showcase" or "judge" in title/description

3. PERFORMANCES: Name as "Performances" or "Performances by [Group Name]"
   - Look for words "performance", "show", or "choreography" in title/description

4. EXHIBITIONS: Name as "Exhibitions" (plural)
   - Look for word "exhibition" in title/description

5. TRAILERS: Name as "Trailers" or "Trailers by [Group Name]"
   - Look for words "featuring" or "trailer" in title/description

6. EXTRAS: Name as "Extras"
   - Everything else (music videos, contests, panel discussions, etc.)
   - ⚠️ If a video doesn't clearly fit into any other section, it MUST go into "Extras" - DO NOT leave it out

7. RECAPS: Name as "Recaps" or "Recaps by [Group Name]"
   - Look for words like "recap", "recap of", or "recap of the event". "hypest", "best of", "dopest", "coolest", "moments" or similar words that have a lot of energy and excitement.

⚠️ CRITICAL: If you're unsure where a video belongs, place it in the most appropriate section or create an "Extras" section. NEVER skip a video - all ${
    videos.length
  } videos must be included.

⚠️ CRITICAL RULE: Only add sections and name them once you know what videos to put in them. There should be no empty sections or brackets. Do NOT create sections based on examples or patterns you think might exist - ONLY create sections for videos that actually exist in the provided list above.

⚠️ CRITICAL RULE: EVERY SINGLE VIDEO must be placed in a section. The total number of videos in your output must equal ${
    videos.length
  } (the number of input videos). Count carefully and ensure no videos are left out.

BRACKET DETECTION (for Battle sections only):
- CRITICAL: Battle sections MUST ALWAYS have brackets (hasBrackets: true)
- Battle sections CANNOT have videos directly in the section - ALL videos must be in brackets
- ⚠️ CRITICAL: Create brackets ONLY based on keywords that ACTUALLY APPEAR in the video titles above
- ⚠️ Bracket naming: Look at the actual video titles and extract bracket indicators like "Finals", "Semi Finals", "Top 8", "Top 16", "Prelims", "Preliminary", "Pre-Selection", "Pre-Selections", "7 to Smoke"
- ⚠️ ONLY create a bracket if you see that bracket name in at least one video title
- ⚠️ DO NOT create "Finals" bracket if no video title contains "Finals"
- ⚠️ DO NOT create "Top 8" bracket if no video title contains "Top 8"
- ⚠️ DO NOT create "Prelims" bracket if no video title contains "Prelims" or "Preliminary"
- If you see bracket indicators in titles, sort videos into appropriate brackets based on what's in their titles
- ⚠️ If a video's title contains "Prelims", "Preliminary", "Pre-Selection", "Pre-Selections", "Pre Selection", "Pre Selections", "Top 8", "Top 4", "Finals", "Semi Finals", or similar bracket indicators, it MUST be placed in a bracket with that bracket name
- ⚠️ The bracket name should match what's in the video title (e.g., if title says "Top 8", create/use a "Top 8" bracket)
- CRITICAL: "Pre-Selection" and "Pre-Selections" (and variations like "Pre Selection", "Pre Selections") are treated EXACTLY the same as "Prelims" - they indicate preliminary rounds and should be grouped using the same logic
- ⚠️ 7-TO-SMOKE RULE: ONLY apply this if video titles actually contain "7 to smoke", "7-to-smoke", "7-to-Smoke", or similar variations:
  * Create a section called "7 to Smoke" (or include style if specified, e.g., "7-to-Smoke Locking")
  * Set hasBrackets: true
  * Create ONE bracket with title "7 to Smoke"
  * Put ALL 7-to-smoke videos (all styles) in that single bracket
  * Do NOT create separate brackets or sections for different styles of 7-to-smoke
  * ⚠️ If NO videos contain "7 to smoke" in their titles, DO NOT create this section
- PRELIM/PRE-SELECTION GROUPING LOGIC:
  * NOTE: "Pre-Selection", "Pre-Selections", and variations are treated EXACTLY the same as "Prelims" and "Preliminary"
  * LOTTERY/MIXED STYLE BATTLES: If you see multiple prelim/pre-selection videos with different styles (e.g., "2v2 Locking Prelims" and "2v2 Waacking Prelims", or "2v2 Locking Pre-Selection" and "2v2 Waacking Pre-Selection") AND the later brackets (Top 8, Top 4, Finals) show mixed styles or style pairings, this is a lottery-style battle
  * In lottery battles: Group ALL prelim/pre-selection videos (all styles) into ONE "Prelims" or "Pre-Selection" bracket within a single section (e.g., "2v2 Locking Waacking" section with "Prelims" bracket containing both Locking and Waacking prelim/pre-selection videos)
  * STANDARD BATTLES: If prelim/pre-selection videos have different styles and later brackets are single-style, create separate sections (e.g., "2v2 Locking" section with "Prelims" bracket, and "2v2 Waacking" section with "Prelims" bracket)
  * How to detect lottery battles: Look at Top 8/Finals video titles - if they show style mixing (e.g., "Locking vs Waacking", or multiple styles in one bracket), it's a lottery battle
- If no clear bracket indicators are found, create a single bracket (e.g., "All Battles" or "Main Bracket") and put all videos there - NEVER put battle videos directly in the section

TITLE PARSING:
- Remove redundant event information from video titles
- Example: "Elveezy Vs Full Kal Vs Fierce One - Turnpike Takeover - Jingle Jangle Jam Vol 4 - Break Infinite"
  Should become: "Elveezy Vs Full Kal Vs Fierce One"
- Keep only the essential performer names and battle format
- Remove event names, volume numbers, emojis, and extra descriptive text

STYLE APPLICATION:
- CRITICAL: You MUST ONLY use dance styles from this exact list: ${DANCE_STYLES.join(
    ", "
  )}
- DO NOT use any other style names, variations, or synonyms
- Apply dance styles to entire sections where appropriate
- Only apply if consistent across section (if too many conflicting styles, leave off)
- Set applyStylesToVideos: true if styles are applied
- If a style cannot be identified or is not in the allowed list, DO NOT include it in the styles array
- IMPORTANT: The "styles" field is OPTIONAL - if you cannot confidently match a style to the allowed list, simply omit the "styles" field entirely (do not include an empty array)

PRIORITIZATION:
- If existing sections are provided, prioritize sorting videos into them first
- Only create new sections if videos don't fit existing ones
- Match videos to existing sections by title keywords, style, or bracket type

VIDEO TYPE MAPPING (match video type to section type):
- Battle sections → use "battle" for all videos
- Tournament sections → use "battle" for all videos (tournaments are structured battles)
- Competition sections → use "battle" for competitive videos, "freestyle" for non-competitive
- Performance sections → use "choreography" for all videos
- Showcase sections → use "freestyle" for all videos
- Class sections → use "class" for all videos
- Session sections → use "class" for instructional content, "choreography" for performances
- Mixed sections → use appropriate type based on video content ("battle", "choreography", "class", or "other")
- Other sections → use "other" for all videos, or specific type if clear from content

JSON SCHEMA (return ONLY this structure, no other text):
{
  "sections": [
    {
      "id": "unique-id-1",
      "title": "Section Name",
      "description": "",
      "sectionType": "Battle" | "Tournament" | "Competition" | "Performance" | "Showcase" | "Class" | "Session" | "Mixed" | "Other",
      "hasBrackets": true | false,
      "videos": [
        {
          "id": "unique-video-id-1",
          "title": "Cleaned video title",
          "src": "https://www.youtube.com/watch?v=VIDEO_ID",
          "type": "battle" | "freestyle" | "choreography" | "class" | "other"
        }
      ],
      "brackets": [
        {
          "id": "unique-bracket-id-1",
          "title": "Bracket Name",
          "videos": [
            {
              "id": "unique-video-id-2",
              "title": "Cleaned video title",
              "src": "https://www.youtube.com/watch?v=VIDEO_ID",
              "type": "battle" | "freestyle" | "choreography" | "class" | "other"
            }
          ]
        }
      ],
      "styles": ["Breaking", "Popping"],
      "applyStylesToVideos": true
    }
  ]
}

CRITICAL CATEGORIZATION PATTERNS - STUDY THESE CAREFULLY:

⚠️⚠️⚠️ MOST IMPORTANT RULE: These patterns are EXAMPLES. ONLY apply them if the actual video titles above match these patterns. DO NOT create sections for patterns that don't exist in the provided video titles. Always examine the actual video titles FIRST before deciding what sections to create. ⚠️⚠️⚠️

1. LOTTERY BATTLE DETECTION:
   - When you see prelim videos with DIFFERENT styles (e.g., "2v2 Locking Prelims" and "2v2 Waacking Prelims"), you MUST check the later brackets (Top 8, Top 4, Finals)
   - If later brackets show MIXED STYLES or style pairings (e.g., videos that don't specify a single style, or show both styles together), this is a LOTTERY BATTLE
   - In lottery battles: Group ALL prelim/pre-selection videos (ALL styles) into ONE "Prelims" bracket within a SINGLE section
   - Example: "2v2 Locking Prelims" + "2v2 Waacking Prelims" → ONE section "2v2 Locking Waacking" with ONE "Prelims" bracket containing BOTH videos
   - Why: The battle format pairs different styles together, so prelims from all styles feed into the same tournament structure
   - If later brackets are SINGLE-STYLE (all Locking or all Waacking), then it's a STANDARD BATTLE and prelims should be in SEPARATE sections

2. BATTLE SECTION STRUCTURE (MANDATORY):
   - ALL Battle sections MUST have hasBrackets: true
   - ALL videos in Battle sections MUST be in brackets - NEVER put videos directly in the section videos array
   - Even if there's only one bracket, it must be in brackets, not directly in the section
   - Example structure: hasBrackets: true, videos: [], brackets: [{title: "...", videos: [...]}]
   - If you see a Battle section with videos directly in it, that's WRONG - move them to brackets

3. BRACKET ORGANIZATION WITHIN BATTLE SECTIONS:
   - ⚠️ First, examine the video titles to see what bracket stages are actually mentioned
   - ⚠️ ONLY create brackets for stages that appear in the video titles
   - ⚠️ If you see "Top 8" in a video title, create a "Top 8" bracket and put that video in it
   - ⚠️ If you see "Prelims" or "Preliminary" in a video title, create a "Prelims" bracket and put that video in it
   - ⚠️ If you see "Top 4" in a video title, create a "Top 4" bracket and put that video in it
   - ⚠️ If you see "Finals" in a video title, create a "Finals" bracket and put that video in it
   - Organize brackets by progression (e.g., Prelims → Top 16 → Top 8 → Top 4 → Semi Finals → Finals) ONLY using brackets that exist in titles
   - If no clear bracket indicators are found in ANY video titles, create a single default bracket like "Battles" or "All Battles"

4. 7-TO-SMOKE CATEGORIZATION (ONLY IF IT EXISTS IN VIDEO TITLES):
   - ⚠️ First check: Do ANY of the actual video titles above contain "7 to smoke", "7-to-smoke", or similar variations?
   - ⚠️ If NO videos have "7 to smoke" in their titles, SKIP this entire rule and DO NOT create a 7-to-smoke section
   - ⚠️ If YES, videos contain "7 to smoke" in their titles, then:
   - Create ONE section called "7 to Smoke" (or "7-to-Smoke [Style]" if style is clear, e.g., "7-to-Smoke Locking")
   - Set hasBrackets: true (7-to-smoke sections are Battle type and need brackets)
   - Create ONE bracket with title "7 to Smoke"
   - Put ALL 7-to-smoke videos (regardless of style) in that single bracket
   - DO NOT create separate sections for "Rookie Waacking 7-to-Smoke" and "Rookie Locking 7-to-Smoke" - they go in the SAME section and bracket
   - The section name can include "Rookie" if all videos are rookie level, but all videos still go in one bracket

5. SECTION TYPE CATEGORIZATION BY KEYWORDS:
   - ⚠️ Look at the actual video titles to determine section types
   - Videos with "Judge Showcase" or "Showcase" in their titles → "Judge Showcases" section (sectionType: "Showcase")
   - Videos with "Performance" in their titles → "Performances" section (sectionType: "Performance")
   - Videos with "Battle", "vs", "v." in their titles → Battle section (sectionType: "Battle")
   - Videos with "Class", "Workshop", "Session" in their titles → Class section (sectionType: "Class")
   - Group ALL videos of the same type together in one section
   - Don't create separate sections for each individual showcase or performance - group them
   - ⚠️ Don't categorize videos into types that aren't indicated by their titles

6. TITLE CLEANING PATTERNS:
   - Remove event name prefixes: "Waack, Crackle, Lock! III Top 8: Nana/Nightstorm v. Trouble/Danzel" → "Nana/Nightstorm v. Trouble/Danzel"
   - Remove volume numbers: "Jingle Jangle Jam Vol 4" → remove
   - Remove emojis and special characters
   - Keep: Performer names, battle format (1v1, 2v2, etc.), vs/v indicators
   - Keep: Bracket indicators if they're part of the actual title (e.g., "Finals" in the cleaned title if it's a finals battle)
   - Remove: Event names, location names (unless part of performer name), dates, "Title:" prefixes

7. STYLE APPLICATION IN SECTIONS:
   - Apply styles at the SECTION level when consistent across the section
   - In the example, "2v2 Locking Waacking" section has styles: ["Locking"] because Locking is the primary style
   - Individual videos in brackets can have their own styles if they differ (e.g., Prelims bracket has one video with ["Locking"] and one with ["Waacking"])
   - Set applyStylesToVideos: true when styles are applied to the section
   - If styles are inconsistent or unclear, omit the styles field entirely

8. VIDEO TYPE MAPPING BY SECTION:
   - Battle sections → all videos type: "battle"
   - Showcase sections → all videos type: "choreography"
   - Performance sections → all videos type: "choreography"
   - Class sections → all videos type: "class"
   - Match the video type to the section type consistently

9. GROUPING RELATED VIDEOS:
   - Videos with the same battle format (e.g., all "2v2") should be in the same section if they're part of the same tournament
   - Videos with the same bracket stage (e.g., all "Top 8") should be in the same bracket
   - Videos with the same content type (e.g., all showcases) should be in the same section
   - Only create separate sections when videos are clearly different events or formats


CRITICAL REQUIREMENTS:
- ⚠️⚠️⚠️ MOST CRITICAL: ALL ${
    videos.length
  } videos MUST be placed somewhere in the output. Every video URL from the input must appear exactly once in the output. Count the videos in your response to verify you have all ${
    videos.length
  } videos.
- Return ONLY valid JSON, no markdown, no code blocks, no explanations
- Do NOT include IDs for sections, videos, or brackets - they will be generated automatically
- All video URLs must be full YouTube URLs (https://www.youtube.com/watch?v=VIDEO_ID)
- If hasBrackets is true, videos array should be empty (videos go in brackets)
- If hasBrackets is false, brackets array should be empty (videos go directly in section)
- MANDATORY: Battle sections MUST have hasBrackets: true and ALL videos must be in brackets - Battle sections CANNOT have videos directly in the section
- MANDATORY: Any video with "Prelims", "Preliminary", "Pre-Selection", "Pre-Selections", "Pre Selection", "Pre Selections", "Top 8", "Top 4", "Finals", or similar bracket keywords MUST be placed in a bracket, never directly in a section
- ⚠️ MANDATORY: Bracket names must be extracted from the actual video titles - if a video title says "Top 8", create a "Top 8" bracket; if no videos mention "Top 8", don't create a "Top 8" bracket
- ⚠️ MANDATORY: Only create brackets that have videos to put in them based on what's in the video titles
- MANDATORY: "Pre-Selection" and "Pre-Selections" (and variations) are treated EXACTLY the same as "Prelims" - they indicate preliminary rounds and follow the same grouping logic
- MANDATORY: 7-TO-SMOKE RULE - If ANY video contains "7 to smoke", "7-to-smoke", or similar:
  * Create a section called "7 to Smoke" (or "7-to-Smoke [Style]" if style is specified)
  * Set hasBrackets: true
  * Create ONE bracket titled "7 to Smoke"
  * Put ALL 7-to-smoke videos (all styles) in that single bracket
  * Do NOT create separate sections or brackets for different styles
- MANDATORY: Prelim/Pre-Selection grouping logic - Analyze the bracket structure to determine if it's a lottery/mixed-style battle:
  * If Top 8/Finals brackets show mixed styles or style pairings → LOTTERY BATTLE → Group all prelim/pre-selection videos (all styles) into ONE "Prelims" or "Pre-Selection" bracket in a single section
  * If Top 8/Finals brackets are single-style → STANDARD BATTLE → Create separate sections for each style's prelims/pre-selections
  * NOTE: "Pre-Selection" variations are treated EXACTLY the same as "Prelims" - use the same grouping logic
- Video types must match section type according to the mapping rules above
- Clean all video titles to remove redundant event information
- Apply styles only when consistent across section
- ⚠️ There should be no empty sections or brackets - only create brackets that have videos to put in them
- ⚠️ Bracket names must come from the actual video titles - don't invent bracket names
- STYLES RESTRICTION: The "styles" field is OPTIONAL. If included, it MUST ONLY contain values from this exact list: ${DANCE_STYLES.join(
    ", "
  )}. Any style not in this list will be automatically filtered out and rejected. If you cannot identify a style that matches the allowed list, simply omit the "styles" field entirely (do not include an empty array)
- ⚠️⚠️⚠️ FINAL REMINDER: ONLY create sections and brackets for content that ACTUALLY EXISTS in the video titles above. DO NOT create sections or brackets based on examples, patterns, or assumptions. If you don't see "7 to smoke" in any title, don't create it. If you don't see "2v2" in any title, don't create it. If you don't see "Finals" in any title, don't create a Finals bracket. Examine the ACTUAL video titles FIRST, then create sections and brackets ONLY for what you find. ⚠️⚠️⚠️

- ⚠️⚠️⚠️ FINAL VALIDATION STEP: Before returning your JSON, count the total videos across all sections and brackets. You MUST have exactly ${
    videos.length
  } videos. If you have fewer, find the missing videos and add them. If you have more, you have duplicates - remove them. Every input video must appear exactly once in the output. ⚠️⚠️⚠️

Now parse the playlist and return the JSON:`;
}

/**
 * Call Groq Compound Mini API to parse playlist
 */
export async function parsePlaylistWithGroq(
  videos: YouTubeVideoMetadata[],
  context: FormContext
): Promise<ParsedPlaylistResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  if (!videos || videos.length === 0) {
    throw new Error("No videos provided to parse");
  }

  // Log input JSON for training/correction
  // console.log("=== LLM INPUT (YouTube Videos & Context) ===");
  // console.log(JSON.stringify({ videos, context }, null, 2));
  // console.log("=== END LLM INPUT ===");

  const prompt = buildPrompt(videos, context);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a JSON parser expert. Always return valid JSON only, no markdown, no code blocks, no explanations.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0, // Lower temperature for more consistent parsing
          response_format: { type: "json_object" }, // Force JSON output
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error("Invalid Groq API key. Please check your credentials.");
      }
      if (response.status === 429) {
        throw new Error(
          "Groq API rate limit exceeded. Please try again in a moment."
        );
      }
      throw new Error(
        `Groq API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from Groq API");
    }

    const content = data.choices[0].message.content;

    if (!content) {
      throw new Error("Empty response from Groq API");
    }

    // Parse JSON response
    let parsed: ParsedPlaylistResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse Groq response:", content);
      throw new Error(
        `Invalid JSON response from LLM: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`
      );
    }

    // Validate structure
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Invalid response structure: missing sections array");
    }

    // Validate that all videos are accounted for
    const inputVideoUrls = new Set(videos.map((v) => v.url));
    const outputVideoUrls = new Set<string>();

    parsed.sections.forEach((section) => {
      // Check videos directly in section
      if (section.videos) {
        section.videos.forEach((video) => {
          outputVideoUrls.add(video.src);
        });
      }
      // Check videos in brackets
      if (section.brackets) {
        section.brackets.forEach((bracket) => {
          if (bracket.videos) {
            bracket.videos.forEach((video) => {
              outputVideoUrls.add(video.src);
            });
          }
        });
      }
    });

    // Check for missing videos
    const missingVideos = Array.from(inputVideoUrls).filter(
      (url) => !outputVideoUrls.has(url)
    );

    // Check for duplicate videos
    const outputVideosList: string[] = [];
    parsed.sections.forEach((section) => {
      if (section.videos) {
        section.videos.forEach((video) => outputVideosList.push(video.src));
      }
      if (section.brackets) {
        section.brackets.forEach((bracket) => {
          if (bracket.videos) {
            bracket.videos.forEach((video) => outputVideosList.push(video.src));
          }
        });
      }
    });
    const duplicateVideos = outputVideosList.filter(
      (url, index) => outputVideosList.indexOf(url) !== index
    );

    if (missingVideos.length > 0) {
      console.error(
        `⚠️ WARNING: ${missingVideos.length} video(s) missing from LLM output:`
      );
      missingVideos.forEach((url) => {
        const video = videos.find((v) => v.url === url);
        console.error(`  - "${video?.title}" (${url})`);
      });
      throw new Error(
        `LLM failed to include all videos. Missing ${missingVideos.length} video(s). Expected ${videos.length} videos, got ${outputVideoUrls.size}.`
      );
    }

    if (duplicateVideos.length > 0) {
      console.error(
        `⚠️ WARNING: ${duplicateVideos.length} duplicate video(s) in LLM output:`
      );
      duplicateVideos.forEach((url) => {
        console.error(`  - ${url}`);
      });
      throw new Error(
        `LLM included duplicate videos. Found ${outputVideosList.length} videos, but only ${outputVideoUrls.size} unique.`
      );
    }

    console.log(
      `✅ Validation passed: All ${videos.length} videos accounted for in output.`
    );

    // Log output JSON for training/correction
    console.log("=== LLM OUTPUT (Parsed Response) ===");
    console.log(JSON.stringify(parsed, null, 2));
    console.log("=== END LLM OUTPUT ===");

    return parsed;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to parse playlist with Groq: ${String(error)}`);
  }
}
