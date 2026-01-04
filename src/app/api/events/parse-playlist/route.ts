import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { extractPlaylistId, fetchPlaylistVideos } from "@/lib/youtube-api";
import { parsePlaylistWithGroq, FormContext } from "@/lib/groq-llm";
import {
  sanitizeParsedPlaylist,
  mergeSections,
} from "@/lib/playlist-parser-utils";
import { Section } from "@/types/event";

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    { minAuthLevel: AUTH_LEVELS.SUPER_ADMIN },
    async (req) => {
      try {
        const body = await req.json();
        const {
          playlistUrl,
          formContext,
        }: {
          playlistUrl: string;
          formContext: FormContext & {
            existingSections?: Section[];
          };
        } = body;

        // Validate input
        if (!playlistUrl || typeof playlistUrl !== "string") {
          return NextResponse.json(
            { error: "Playlist URL is required" },
            { status: 400 }
          );
        }

        if (!formContext) {
          return NextResponse.json(
            { error: "Form context is required" },
            { status: 400 }
          );
        }

        // Extract playlist ID
        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
          return NextResponse.json(
            {
              error:
                "Invalid playlist URL. Please provide a valid YouTube playlist URL.",
            },
            { status: 400 }
          );
        }

        // Fetch playlist videos from YouTube API
        let playlistData;
        try {
          playlistData = await fetchPlaylistVideos(playlistId);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return NextResponse.json(
            {
              error: `Failed to fetch playlist videos: ${errorMessage}`,
            },
            { status: 500 }
          );
        }

        if (!playlistData.videos || playlistData.videos.length === 0) {
          return NextResponse.json(
            { error: "No videos found in playlist" },
            { status: 400 }
          );
        }

        // Parse with Groq LLM
        let parsedResponse;
        try {
          parsedResponse = await parsePlaylistWithGroq(
            playlistData.videos,
            formContext
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return NextResponse.json(
            {
              error: `Failed to parse playlist with LLM: ${errorMessage}`,
            },
            { status: 500 }
          );
        }

        // Sanitize parsed data
        let sanitizedSections: Section[];
        try {
          sanitizedSections = sanitizeParsedPlaylist(parsedResponse);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return NextResponse.json(
            {
              error: `Data validation failed: ${errorMessage}`,
            },
            { status: 500 }
          );
        }

        // Merge with existing sections if provided
        let finalSections = sanitizedSections;
        if (
          formContext.existingSections &&
          Array.isArray(formContext.existingSections) &&
          formContext.existingSections.length > 0
        ) {
          try {
            finalSections = mergeSections(
              formContext.existingSections,
              sanitizedSections
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            console.error("Failed to merge sections:", errorMessage);
            // Continue with new sections only if merge fails
            finalSections = sanitizedSections;
          }
        }

        return NextResponse.json({
          success: true,
          sections: finalSections,
          playlistTitle: playlistData.playlistTitle,
          videoCount: playlistData.videos.length,
        });
      } catch (error) {
        console.error("Error parsing playlist:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
          {
            error: `Failed to parse playlist: ${errorMessage}`,
          },
          { status: 500 }
        );
      }
    }
  );
}
