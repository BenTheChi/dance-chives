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
