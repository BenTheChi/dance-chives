import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import {
  addToBatch,
  resetBatch,
  validateReactionsPayload,
  validateReactionsPayloadAnon,
} from "@/lib/reactions-batch";
import {
  writeReactionsImmediate,
  writeReactionsImmediateAnonMerge,
} from "@/lib/reactions-write";

const ANON_USER_ID = "anon";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

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
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const session = await auth();

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    const userId = session?.user?.id ?? ANON_USER_ID;

    if (userId === ANON_USER_ID) {
      const result = validateReactionsPayloadAnon(body);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status }
        );
      }
      await writeReactionsImmediateAnonMerge(videoId, result.payload);
    } else {
      const result = validateReactionsPayload(body);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status }
        );
      }
      addToBatch(videoId, userId, result.payload);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving react:", error);
    return NextResponse.json(
      { error: "Failed to save react" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const session = await auth();

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    const userId = session?.user?.id ?? ANON_USER_ID;

    if (userId === ANON_USER_ID) {
      await writeReactionsImmediate(videoId, ANON_USER_ID, {
        fire: [],
        clap: [],
        wow: [],
        laugh: [],
      });
    } else {
      resetBatch(videoId, userId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting react:", error);
    return NextResponse.json(
      { error: "Failed to reset react" },
      { status: 500 }
    );
  }
}
