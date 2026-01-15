"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { FormContext } from "@/lib/llm";
import { Section } from "@/types/event";

interface PlaylistParserProps {
  formContext: FormContext & {
    existingSections?: Section[];
  };
  onParseSuccess: (sections: Section[]) => void;
  // Props for managing playlist parsing job state from parent
  parentPlaylistJobId?: string | null;
  parentIsParsingPlaylist?: boolean;
  onPlaylistJobStart?: (jobId: string) => void;
}

export function PlaylistParser({
  formContext,
  onParseSuccess,
  parentPlaylistJobId,
  parentIsParsingPlaylist,
  onPlaylistJobStart,
}: PlaylistParserProps) {
  const { data: session } = useSession();
  const [playlistUrl, setPlaylistUrl] = useState("");

  // Check if user is Super Admin
  const isSuperAdmin =
    session?.user?.auth !== undefined &&
    session.user.auth >= AUTH_LEVELS.SUPER_ADMIN;

  // Use parent's loading state if available, otherwise use local state
  const isLoading = parentIsParsingPlaylist ?? false;

  // Helper function to calculate and display statistics
  const handleParseSuccess = (sections: Section[]) => {
    // Calculate detailed statistics
    const totalBrackets = sections.reduce(
      (sum, section) => sum + (section.brackets?.length || 0),
      0
    );
    const totalVideosInBrackets = sections.reduce(
      (sum, section) =>
        sum +
        (section.brackets?.reduce(
          (bracketSum, bracket) => bracketSum + (bracket.videos?.length || 0),
          0
        ) || 0),
      0
    );
    const totalDirectVideos = sections.reduce(
      (sum, section) => sum + (section.videos?.length || 0),
      0
    );
    const totalVideos = totalVideosInBrackets + totalDirectVideos;

    // Build detailed toast message
    let message = `Successfully parsed ${totalVideos} video${
      totalVideos !== 1 ? "s" : ""
    } into ${sections.length} section${sections.length !== 1 ? "s" : ""}`;

    if (totalBrackets > 0) {
      message += ` with ${totalBrackets} bracket${
        totalBrackets !== 1 ? "s" : ""
      }`;
      if (totalVideosInBrackets > 0) {
        message += ` (${totalVideosInBrackets} video${
          totalVideosInBrackets !== 1 ? "s" : ""
        } in brackets)`;
      }
    }

    if (totalDirectVideos > 0) {
      message += ` and ${totalDirectVideos} direct video${
        totalDirectVideos !== 1 ? "s" : ""
      }`;
    }

    toast.success(message);
    onParseSuccess(sections);
    setPlaylistUrl(""); // Clear input on success
  };

  // Don't render if not Super Admin
  if (!isSuperAdmin) {
    return null;
  }

  const handleParse = async () => {
    if (!playlistUrl.trim()) {
      toast.error("Please enter a YouTube playlist URL");
      return;
    }

    try {
      const response = await fetch("/api/events/parse-playlist/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playlistUrl: playlistUrl.trim(),
          formContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start playlist parse");
      }

      if (data.success && data.jobId) {
        // Notify parent to start polling (polling happens at parent level)
        if (onPlaylistJobStart) {
          onPlaylistJobStart(data.jobId);
        }
        toast.info("Playlist parsing started! Processing in the background...");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to start playlist parse: ${errorMessage}`);
      console.error("Playlist parsing error:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleParse();
    }
  };

  return (
    <div className="border-2 border-primary-light rounded-sm p-4 bg-primary-dark mb-6 max-w-xl">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 max-w-[500px]">
          <h3>YouTube Playlist Parser (Super Admin Only)</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a YouTube playlist URL to automatically parse videos into
          sections, brackets, and videos.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="https://www.youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 bg-neutral-300"
            />
            <Button
              onClick={handleParse}
              disabled={isLoading || !playlistUrl.trim()}
              className="bg-periwinkle text-black border-black hover:bg-periwinkle/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                "Parse Playlist"
              )}
            </Button>
          </div>
          {isLoading && (
            <p className="text-xs text-muted-foreground">
              Processing in background. You can continue filling out other tabs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
