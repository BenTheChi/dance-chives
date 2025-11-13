import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateShortId(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumerics with hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens from start/end
}

export function extractYouTubeVideoId(url: string): string | null {
  // Regular expressions to match different YouTube URL formats
  const patterns = [
    // Standard watch URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    // Shortened youtu.be URL
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&]+)/,
    // Embed URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&]+)/,
    // YouTube Short
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function generateSlugId(title: string, randomLength = 6) {
  const slug = slugify(title);
  const randomId = generateShortId(randomLength);
  return `${slug}-${randomId}`;
}

/**
 * Normalizes YouTube thumbnail URLs to use a more reliable format.
 * maxresdefault.jpg doesn't always exist, so we fall back to hqdefault.jpg
 * which is more commonly available.
 */
export function normalizeYouTubeThumbnailUrl(url: string | null | undefined): string {
  if (!url) return "/exploreEvents.jpg";
  
  // Check if this is a YouTube thumbnail URL
  const youtubeThumbnailPattern = /^https?:\/\/img\.youtube\.com\/vi\/([^\/]+)\/(maxresdefault|hqdefault|mqdefault|sddefault|default)\.jpg$/;
  const match = url.match(youtubeThumbnailPattern);
  
  if (match) {
    const videoId = match[1];
    const currentFormat = match[2];
    
    // If it's maxresdefault, replace with hqdefault (more reliable)
    if (currentFormat === "maxresdefault") {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    // Otherwise, return as-is
    return url;
  }
  
  // Not a YouTube thumbnail URL, return as-is
  return url;
}
