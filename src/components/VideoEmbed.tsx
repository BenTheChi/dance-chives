import { AspectRatio } from "@/components/ui/aspect-ratio";

function convertYouTubeUrlToEmbed(url: string): string | null {
  // Regular expressions to match different YouTube URL formats
  const patterns = [
    // Standard watch URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,

    // Shortened youtu.be URL
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&]+)/,

    // Embed URL (already in correct format)
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&]+)/,

    //Youtube Short
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?&]+)/,

    //Playlist
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match) {
      // Extract video ID (first capturing group)
      const videoId = match[1];

      console.log(videoId);

      // Return embed URL
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // Return null if no match found
  return null;
}

export function VideoEmbed({ title, src }: { title: string; src: string }) {
  if (!convertYouTubeUrlToEmbed(src))
    return (
      <AspectRatio ratio={16 / 9}>
        <div className="flex items-center justify-center h-full border rounded-md">
          <p className="text-sm text-muted-foreground">No video selected</p>
        </div>
      </AspectRatio>
    );

  return (
    <AspectRatio ratio={16 / 9} className="rounded-md">
      <iframe
        loading="lazy"
        src={convertYouTubeUrlToEmbed(src) || ""}
        title={title}
        style={{
          border: 0,
          width: "100%",
          height: "100%",
          borderRadius: "8px",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </AspectRatio>
  );
}
