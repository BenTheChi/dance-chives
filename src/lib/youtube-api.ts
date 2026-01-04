/**
 * YouTube Data API v3 client for fetching playlist videos
 */

export interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  publishedAt?: string;
}

export interface YouTubePlaylistResponse {
  videos: YouTubeVideoMetadata[];
  playlistTitle?: string;
}

/**
 * Extract playlist ID from various YouTube playlist URL formats
 */
export function extractPlaylistId(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  // Remove whitespace
  const trimmed = url.trim();

  // Pattern 1: https://www.youtube.com/playlist?list=PLxxxxx
  const playlistPattern1 = /[?&]list=([a-zA-Z0-9_-]+)/;
  const match1 = trimmed.match(playlistPattern1);
  if (match1 && match1[1]) {
    return match1[1];
  }

  // Pattern 2: https://youtube.com/playlist?list=PLxxxxx
  const playlistPattern2 = /youtube\.com\/playlist[?&]list=([a-zA-Z0-9_-]+)/;
  const match2 = trimmed.match(playlistPattern2);
  if (match2 && match2[1]) {
    return match2[1];
  }

  // Pattern 3: Direct playlist ID (PLxxxxx)
  const directPattern = /^PL[a-zA-Z0-9_-]+$/;
  if (directPattern.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Fetch all videos from a YouTube playlist using Data API v3
 * Handles pagination automatically
 */
export async function fetchPlaylistVideos(
  playlistId: string
): Promise<YouTubePlaylistResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is not set");
  }

  if (!playlistId) {
    throw new Error("Playlist ID is required");
  }

  const videos: YouTubeVideoMetadata[] = [];
  let nextPageToken: string | undefined;
  let playlistTitle: string | undefined;

  do {
    // First, get playlist details to get the title
    if (!playlistTitle) {
      try {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
        const playlistResponse = await fetch(playlistUrl);

        if (!playlistResponse.ok) {
          const errorData = await playlistResponse.json().catch(() => ({}));
          if (playlistResponse.status === 404) {
            throw new Error(
              "Playlist not found. Please check the playlist URL."
            );
          }
          if (playlistResponse.status === 403) {
            throw new Error(
              "YouTube API access denied. Please check your API key and quota."
            );
          }
          throw new Error(
            `Failed to fetch playlist: ${
              errorData.error?.message || playlistResponse.statusText
            }`
          );
        }

        const playlistData = await playlistResponse.json();
        if (playlistData.items && playlistData.items.length > 0) {
          playlistTitle = playlistData.items[0].snippet?.title;
        }
      } catch (error) {
        // If playlist fetch fails, continue with video fetch
        console.warn("Failed to fetch playlist title:", error);
      }
    }

    // Fetch playlist items
    const itemsUrl = new URL(
      "https://www.googleapis.com/youtube/v3/playlistItems"
    );
    itemsUrl.searchParams.set("part", "snippet,contentDetails");
    itemsUrl.searchParams.set("playlistId", playlistId);
    itemsUrl.searchParams.set("maxResults", "50"); // Maximum allowed per request
    itemsUrl.searchParams.set("key", apiKey);

    if (nextPageToken) {
      itemsUrl.searchParams.set("pageToken", nextPageToken);
    }

    const response = await fetch(itemsUrl.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error("Playlist not found. Please check the playlist URL.");
      }
      if (response.status === 403) {
        throw new Error(
          "YouTube API access denied. Please check your API key and quota."
        );
      }
      throw new Error(
        `Failed to fetch playlist videos: ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();

    // Process videos
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        const videoId = item.contentDetails?.videoId;
        const snippet = item.snippet;

        if (videoId && snippet) {
          videos.push({
            videoId,
            title: snippet.title || "Untitled Video",
            description: snippet.description || "",
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl:
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              snippet.thumbnails?.default?.url,
            publishedAt: snippet.publishedAt,
          });
        }
      }
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  if (videos.length === 0) {
    throw new Error("No videos found in this playlist.");
  }

  return {
    videos,
    playlistTitle,
  };
}
