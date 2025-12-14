export interface YouTubeOEmbedResponse {
  title: string;
  thumbnail_url: string;
  author_name?: string;
  provider_name?: string;
}

/**
 * Fetch YouTube oEmbed metadata for a given URL.
 * Uses the public oEmbed endpoint (no API key needed).
 */
export async function fetchYouTubeOEmbed(
  url: string
): Promise<YouTubeOEmbedResponse> {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    url
  )}&format=json`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to fetch video metadata");
  }

  const data = (await response.json()) as YouTubeOEmbedResponse;
  return data;
}
