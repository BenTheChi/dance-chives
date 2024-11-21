import { AspectRatio } from '@mantine/core';

function convertYouTubeUrlToEmbed(url: string): string | null {
  // Regular expressions to match different YouTube URL formats
  const patterns = [
    // Standard watch URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,

    // Shortened youtu.be URL
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&]+)/,

    // Embed URL (already in correct format)
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&]+)/,
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match) {
      // Extract video ID (first capturing group)
      const videoId = match[1];

      // Return embed URL
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // Return null if no match found
  return null;
}

export function Video({ title, src }: { title: string; src: string }) {
  return (
    <AspectRatio ratio={16 / 9}>
      <iframe
        src={convertYouTubeUrlToEmbed(src) || ''}
        title={title}
        style={{ border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </AspectRatio>
  );
}
