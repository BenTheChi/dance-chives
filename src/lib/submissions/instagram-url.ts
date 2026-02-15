export type InstagramPostKind = "p" | "reel";

export interface CanonicalInstagramPostUrl {
  canonicalUrl: string;
  shortcode: string;
  kind: InstagramPostKind;
}

const VALID_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
]);

const SHORTCODE_PATTERN = /^[A-Za-z0-9_-]+$/;

export function canonicalizeInstagramPostOrReelUrl(
  input: string
): CanonicalInstagramPostUrl | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!VALID_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  if (pathSegments.length < 2) {
    return null;
  }

  const kind = pathSegments[0]?.toLowerCase();
  const shortcode = pathSegments[1]?.trim();

  if (!shortcode || !SHORTCODE_PATTERN.test(shortcode)) {
    return null;
  }

  if (kind !== "p" && kind !== "reel") {
    return null;
  }

  return {
    canonicalUrl: `https://www.instagram.com/${kind}/${shortcode}/`,
    shortcode,
    kind,
  };
}
