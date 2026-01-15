/**
 * Data sanitization and validation utilities for playlist parser
 * Ensures LLM response matches form schema
 */

import { ParsedSection, ParsedPlaylistResponse } from "./groq-llm";
import { Section, Bracket, Video } from "@/types/event";
import { DANCE_STYLES, validateDanceStyles } from "./utils/dance-styles";

const VALID_SECTION_TYPES = [
  "Battle",
  "Competition",
  "Performance",
  "Exhibition",
  "Showcase",
  "Class",
  "Session",
  "Party",
  "Other",
] as const;

const VALID_VIDEO_TYPES = [
  "battle",
  "freestyle",
  "choreography",
  "class",
  "other",
] as const;

/**
 * Generate a unique ID for sections/videos/brackets
 * Uses crypto.randomUUID() for proper UUID v4 generation
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Validate and sanitize video data
 */
function sanitizeVideo(video: any, index: number, sectionIndex: number): Video {
  if (!video || typeof video !== "object") {
    throw new Error(
      `Invalid video at index ${index} in section ${sectionIndex}`
    );
  }

  // Validate and sanitize title
  const title = String(video.title || `Video ${index + 1}`).trim();
  if (!title) {
    throw new Error(
      `Video at index ${index} in section ${sectionIndex} has no title`
    );
  }

  // Validate and sanitize URL
  const src = String(video.src || "").trim();
  if (!src) {
    throw new Error(
      `Video at index ${index} in section ${sectionIndex} has no URL`
    );
  }

  // Validate YouTube URL format
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?&]+)/,
  ];

  const isValidUrl = youtubePatterns.some((pattern) => pattern.test(src));
  if (!isValidUrl) {
    throw new Error(`Video "${title}" has invalid YouTube URL: ${src}`);
  }

  // Validate and sanitize video type
  const videoType = String(video.type || "freestyle").toLowerCase();
  const validType = VALID_VIDEO_TYPES.includes(
    videoType as (typeof VALID_VIDEO_TYPES)[number]
  )
    ? (videoType as (typeof VALID_VIDEO_TYPES)[number])
    : "freestyle";

  // Sanitize and validate styles if present - only allow styles from DANCE_STYLES constant
  const rawStyles =
    Array.isArray(video.styles) && video.styles.length > 0
      ? video.styles
          .map((s: any) => String(s).trim())
          .filter((s: string) => s.length > 0)
      : [];
  const styles =
    rawStyles.length > 0 ? validateDanceStyles(rawStyles) : undefined;

  return {
    id: video.id && typeof video.id === "string" ? video.id : generateId(),
    title: title.substring(0, 200), // Limit title length
    src,
    type: validType,
    styles,
  };
}

/**
 * Validate and sanitize bracket data
 */
function sanitizeBracket(
  bracket: any,
  index: number,
  sectionIndex: number
): Bracket {
  if (!bracket || typeof bracket !== "object") {
    throw new Error(
      `Invalid bracket at index ${index} in section ${sectionIndex}`
    );
  }

  const title = String(bracket.title || `Bracket ${index + 1}`).trim();
  if (!title) {
    throw new Error(
      `Bracket at index ${index} in section ${sectionIndex} has no title`
    );
  }

  const videos = Array.isArray(bracket.videos)
    ? bracket.videos.map((v: any, vidIndex: number) =>
        sanitizeVideo(v, vidIndex, sectionIndex)
      )
    : [];

  return {
    id:
      bracket.id && typeof bracket.id === "string" ? bracket.id : generateId(),
    title: title.substring(0, 100), // Limit title length
    videos,
  };
}

/**
 * Validate and sanitize section data
 */
function sanitizeSection(section: any, index: number): Section {
  if (!section || typeof section !== "object") {
    throw new Error(`Invalid section at index ${index}`);
  }

  // Validate and sanitize title
  const title = String(section.title || `Section ${index + 1}`).trim();
  if (!title) {
    throw new Error(`Section at index ${index} has no title`);
  }

  // Validate and sanitize section type
  const sectionType = String(section.sectionType || "Battle");
  const validSectionType = VALID_SECTION_TYPES.includes(
    sectionType as (typeof VALID_SECTION_TYPES)[number]
  )
    ? (sectionType as (typeof VALID_SECTION_TYPES)[number])
    : "Battle";

  // Validate hasBrackets
  let hasBrackets = Boolean(section.hasBrackets);

  // Sanitize description
  const description =
    section.description && typeof section.description === "string"
      ? String(section.description).trim().substring(0, 1000)
      : "";

  // Sanitize videos (only if hasBrackets is false)
  let videos = hasBrackets
    ? []
    : Array.isArray(section.videos)
    ? section.videos.map((v: any, vidIndex: number) =>
        sanitizeVideo(v, vidIndex, index)
      )
    : [];

  // Sanitize brackets (only if hasBrackets is true)
  const brackets = hasBrackets
    ? Array.isArray(section.brackets)
      ? section.brackets.map((b: any, bracketIndex: number) =>
          sanitizeBracket(b, bracketIndex, index)
        )
      : []
    : [];

  // Validate that if hasBrackets is true, videos array should be empty
  if (hasBrackets && videos.length > 0) {
    console.warn(
      `Section "${title}" has hasBrackets=true but also has videos. Moving videos to brackets.`
    );
    // Move videos to a default bracket if they exist
    if (brackets.length === 0) {
      brackets.push({
        id: generateId(),
        title: "All Battles",
        videos: [...videos],
      });
      videos = [];
    } else {
      // Add videos to the first bracket
      brackets[0].videos.push(...videos);
      videos = [];
    }
  }

  // CRITICAL: Battle sections cannot have videos directly - they must be in brackets
  if (validSectionType === "Battle" && videos.length > 0) {
    console.warn(
      `Section "${title}" is a Battle section but has ${videos.length} video(s) directly in section. Battle sections must have all videos in brackets. Moving to brackets.`
    );
    if (brackets.length === 0) {
      brackets.push({
        id: generateId(),
        title: "All Battles",
        videos: [...videos],
      });
    } else {
      brackets[0].videos.push(...videos);
    }
    videos = [];
    hasBrackets = true;
  }

  // Validate that if hasBrackets is false, brackets array should be empty
  if (!hasBrackets && brackets.length > 0) {
    console.warn(
      `Section "${title}" has hasBrackets=false but also has brackets. Ignoring brackets.`
    );
  }

  // Sanitize and validate styles - only allow styles from DANCE_STYLES constant
  const rawStyles =
    Array.isArray(section.styles) && section.styles.length > 0
      ? section.styles
          .map((s: any) => String(s).trim())
          .filter((s: string) => s.length > 0)
      : [];
  const styles =
    rawStyles.length > 0 ? validateDanceStyles(rawStyles) : undefined;

  // Log warning if invalid styles were filtered out
  if (rawStyles.length > 0 && (!styles || styles.length < rawStyles.length)) {
    const invalidStyles = rawStyles.filter(
      (s: string) => !styles?.includes(s as (typeof DANCE_STYLES)[number])
    );
    if (invalidStyles.length > 0) {
      console.warn(
        `Section "${title}" contained invalid styles that were filtered out: ${invalidStyles.join(
          ", "
        )}`
      );
    }
  }

  // Validate applyStylesToVideos
  const applyStylesToVideos =
    styles && styles.length > 0
      ? Boolean(section.applyStylesToVideos)
      : undefined;

  return {
    id:
      section.id && typeof section.id === "string" ? section.id : generateId(),
    title: title.substring(0, 200), // Limit title length
    description,
    sectionType: validSectionType,
    hasBrackets,
    videos,
    brackets,
    styles,
    applyStylesToVideos,
    bgColor: "#ffffff", // Default background color
  };
}

/**
 * Sanitize and validate parsed playlist response
 */
export function sanitizeParsedPlaylist(
  parsed: ParsedPlaylistResponse
): Section[] {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid parsed response: not an object");
  }

  if (!Array.isArray(parsed.sections)) {
    throw new Error("Invalid parsed response: sections is not an array");
  }

  if (parsed.sections.length === 0) {
    throw new Error("No sections found in parsed response");
  }

  try {
    const sanitizedSections = parsed.sections.map((section, index) =>
      sanitizeSection(section, index)
    );

    // Validate that all videos are accounted for
    const totalVideos = sanitizedSections.reduce((count, section) => {
      const sectionVideos = section.videos.length;
      const bracketVideos = section.brackets.reduce(
        (bracketCount, bracket) => bracketCount + bracket.videos.length,
        0
      );
      return count + sectionVideos + bracketVideos;
    }, 0);

    if (totalVideos === 0) {
      throw new Error("No videos found in any sections");
    }

    return sanitizedSections;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Data sanitization failed: ${error.message}`);
    }
    throw new Error("Data sanitization failed: Unknown error");
  }
}

/**
 * Merge parsed sections with existing sections
 * Prioritizes existing sections and tries to match videos to them
 */
export function mergeSections(
  existingSections: Section[],
  newSections: Section[]
): Section[] {
  if (existingSections.length === 0) {
    return newSections;
  }

  // Create a map of existing sections by title (case-insensitive)
  const existingMap = new Map<string, Section>();
  existingSections.forEach((section) => {
    const key = section.title.toLowerCase().trim();
    existingMap.set(key, section);
  });

  const merged: Section[] = [...existingSections];
  const processedVideoIds = new Set<string>();

  // First, try to add videos to existing sections
  for (const newSection of newSections) {
    const existingKey = newSection.title.toLowerCase().trim();
    const existingSection = existingMap.get(existingKey);

    if (existingSection) {
      // Merge videos into existing section
      if (!existingSection.hasBrackets && !newSection.hasBrackets) {
        // Both are non-bracket sections, merge videos
        const newVideos = newSection.videos.filter(
          (v) => !processedVideoIds.has(v.src)
        );
        existingSection.videos.push(...newVideos);
        newVideos.forEach((v) => processedVideoIds.add(v.src));
      } else if (existingSection.hasBrackets && newSection.hasBrackets) {
        // Both have brackets, try to merge brackets
        const existingBracketMap = new Map<string, Bracket>();
        existingSection.brackets.forEach((b) => {
          existingBracketMap.set(b.title.toLowerCase().trim(), b);
        });

        for (const newBracket of newSection.brackets) {
          const bracketKey = newBracket.title.toLowerCase().trim();
          const existingBracket = existingBracketMap.get(bracketKey);

          if (existingBracket) {
            // Merge videos into existing bracket
            const newVideos = newBracket.videos.filter(
              (v) => !processedVideoIds.has(v.src)
            );
            existingBracket.videos.push(...newVideos);
            newVideos.forEach((v) => processedVideoIds.add(v.src));
          } else {
            // Add new bracket to existing section
            const newVideos = newBracket.videos.filter(
              (v) => !processedVideoIds.has(v.src)
            );
            if (newVideos.length > 0) {
              existingSection.brackets.push({
                ...newBracket,
                videos: newVideos,
              });
              newVideos.forEach((v) => processedVideoIds.add(v.src));
            }
          }
        }
      }
    } else {
      // New section, add it
      const filteredSection = {
        ...newSection,
        videos: newSection.videos.filter((v) => !processedVideoIds.has(v.src)),
        brackets: newSection.brackets.map((b) => ({
          ...b,
          videos: b.videos.filter((v) => !processedVideoIds.has(v.src)),
        })),
      };

      // Only add if it has videos
      const hasVideos =
        filteredSection.videos.length > 0 ||
        filteredSection.brackets.some((b) => b.videos.length > 0);

      if (hasVideos) {
        merged.push(filteredSection);
        // Track all videos in this section
        filteredSection.videos.forEach((v) => processedVideoIds.add(v.src));
        filteredSection.brackets.forEach((b) =>
          b.videos.forEach((v) => processedVideoIds.add(v.src))
        );
      }
    }
  }

  return merged;
}
