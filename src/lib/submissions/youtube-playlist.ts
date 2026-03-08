export type CanonicalYouTubePlaylist = {
  canonicalUrl: string;
  playlistId: string;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const PLAYLIST_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;

function extractPlaylistIdFromUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(hostname)) {
    return null;
  }

  const playlistId = (parsed.searchParams.get("list") ?? "").trim();
  if (!PLAYLIST_ID_PATTERN.test(playlistId)) {
    return null;
  }

  return playlistId;
}

export function canonicalizeYouTubePlaylistUrl(
  rawUrl: string
): CanonicalYouTubePlaylist | null {
  const playlistId = extractPlaylistIdFromUrl(rawUrl);
  if (!playlistId) {
    return null;
  }

  return {
    canonicalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    playlistId,
  };
}

export function extractPlaylistIdFromYouTubeUrl(url: string): string | null {
  return extractPlaylistIdFromUrl(url);
}
