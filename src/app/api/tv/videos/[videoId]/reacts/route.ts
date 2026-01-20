import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/utils/api-auth";
import { prisma } from "@/lib/primsa";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 },
      );
    }

    // Fetch all reacts for this video
    const reacts = await prisma.react.findMany({
      where: { videoId },
      select: {
        userId: true,
        fire: true,
        clap: true,
        wow: true,
        laugh: true,
      },
    });

    return NextResponse.json(reacts, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching reacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch reacts" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  return withApiAuth(
    request,
    { requireAuth: true },
    async (request, session) => {
      try {
        const { videoId } = await params;
        const body = await request.json();
        const { type, timestamp } = body;

        if (!videoId) {
          return NextResponse.json(
            { error: "videoId is required" },
            { status: 400 },
          );
        }

        if (!type || !["fire", "clap", "wow", "laugh"].includes(type)) {
          return NextResponse.json(
            { error: "Invalid react type" },
            { status: 400 },
          );
        }

        if (typeof timestamp !== "number" || timestamp < 0) {
          return NextResponse.json(
            { error: "Invalid timestamp" },
            { status: 400 },
          );
        }

        const userId = session.user.id;

        // Check if react record exists using findFirst (composite keys)
        const existingReact = await prisma.react.findFirst({
          where: {
            userId,
            videoId,
          },
        });

        if (existingReact) {
          // Update existing react
          await prisma.react.updateMany({
            where: {
              userId,
              videoId,
            },
            data: {
              [type]: timestamp,
            },
          });
        } else {
          // Create new react
          await prisma.react.create({
            data: {
              userId,
              videoId,
              fire: type === "fire" ? timestamp : 0,
              clap: type === "clap" ? timestamp : 0,
              wow: type === "wow" ? timestamp : 0,
              laugh: type === "laugh" ? timestamp : 0,
            },
          });
        }

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("Error saving react:", error);
        return NextResponse.json(
          { error: "Failed to save react" },
          { status: 500 },
        );
      }
    },
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  return withApiAuth(
    request,
    { requireAuth: true },
    async (request, session) => {
      try {
        const { videoId } = await params;

        if (!videoId) {
          return NextResponse.json(
            { error: "videoId is required" },
            { status: 400 },
          );
        }

        const userId = session.user.id;

        // Check if react record exists
        const existingReact = await prisma.react.findFirst({
          where: {
            userId,
            videoId,
          },
        });

        if (existingReact) {
          // Update existing react to reset all timestamps to 0
          await prisma.react.updateMany({
            where: {
              userId,
              videoId,
            },
            data: {
              fire: 0,
              clap: 0,
              wow: 0,
              laugh: 0,
            },
          });
        }
        // If no react exists, nothing to reset

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("Error resetting react:", error);
        return NextResponse.json(
          { error: "Failed to reset react" },
          { status: 500 },
        );
      }
    },
  );
}
