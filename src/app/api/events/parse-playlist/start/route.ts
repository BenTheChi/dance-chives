import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { AUTH_LEVELS } from "@/lib/utils/auth-constants";
import { extractPlaylistId, fetchPlaylistVideos } from "@/lib/youtube-api";
import { parsePlaylistWithGroq, FormContext } from "@/lib/llm";
import {
  sanitizeParsedPlaylist,
  mergeSections,
} from "@/lib/playlist-parser-utils";
import { Section } from "@/types/event";
import {
  createJob,
  updateJobStatus,
} from "@/lib/job-status-manager";

async function processPlaylist(
  jobId: string,
  playlistUrl: string,
  formContext: FormContext & {
    existingSections?: Section[];
  }
) {
  try {
    await updateJobStatus(jobId, "processing");

    // Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      throw new Error(
        "Invalid playlist URL. Please provide a valid YouTube playlist URL."
      );
    }

    // Fetch playlist videos from YouTube API
    const playlistData = await fetchPlaylistVideos(playlistId);

    if (!playlistData.videos || playlistData.videos.length === 0) {
      throw new Error("No videos found in playlist");
    }

    // Parse with Groq LLM
    const parsedResponse = await parsePlaylistWithGroq(
      playlistData.videos,
      formContext
    );

    // Sanitize parsed data
    let sanitizedSections: Section[] = sanitizeParsedPlaylist(parsedResponse);

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

    // Store result and mark as completed
    await updateJobStatus(jobId, "completed", {
      sections: finalSections,
      playlistTitle: playlistData.playlistTitle,
      videoCount: playlistData.videos.length,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to parse playlist";
    await updateJobStatus(jobId, "failed", undefined, errorMessage);
  }
}

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

        // Create a job and start processing in background
        const jobId = await createJob();

        // Start processing in background (don't await)
        processPlaylist(jobId, playlistUrl, formContext).catch(
          async (error) => {
            console.error("Background playlist processing error:", error);
            await updateJobStatus(
              jobId,
              "failed",
              undefined,
              error instanceof Error ? error.message : "Unknown error"
            );
          }
        );

        // Return job ID immediately
        return NextResponse.json({
          success: true,
          jobId,
        });
      } catch (error) {
        console.error("Error starting playlist parse:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
          {
            error: `Failed to start playlist parse: ${errorMessage}`,
          },
          { status: 500 }
        );
      }
    }
  );
}

