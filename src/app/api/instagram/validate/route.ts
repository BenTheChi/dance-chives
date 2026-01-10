import { NextRequest, NextResponse } from "next/server";
import driver from "@/db/driver";
import { getUnclaimedUserTagCount } from "@/lib/server_actions/auth_actions";
import { normalizeInstagramHandle } from "@/lib/utils/instagram";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle") || "";
  const normalized = normalizeInstagramHandle(handle);

  if (!normalized) {
    return NextResponse.json(
      { error: "Instagram handle is required" },
      { status: 400 }
    );
  }

  // Get current user's session to check if they own this handle
  const authSession = await auth();
  const currentUserId = authSession?.user?.id;

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (u:User {instagram: $instagram})
      RETURN u
      LIMIT 1
      `,
      { instagram: normalized }
    );

    if (result.records.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const user = result.records[0].get("u").properties as {
      id: string;
      displayName?: string;
      username?: string;
      claimed?: boolean;
    };

    const claimed = user.claimed === false ? false : true;

    // If this handle belongs to the current user, treat it as available (their own handle)
    if (currentUserId && user.id === currentUserId) {
      return NextResponse.json({
        exists: true,
        claimed: true,
        ownedByCurrentUser: true,
        userId: user.id,
        displayName: user.displayName || null,
        username: user.username || null,
      });
    }

    if (claimed) {
      return NextResponse.json({
        exists: true,
        claimed: true,
        userId: user.id,
        displayName: user.displayName || null,
        username: user.username || null,
      });
    }

    const tagCount = await getUnclaimedUserTagCount(user.id);

    return NextResponse.json({
      exists: true,
      claimed: false,
      userId: user.id,
      displayName: user.displayName || null,
      username: user.username || null,
      tagCount,
    });
  } catch (error) {
    console.error("Failed to validate instagram handle", error);
    return NextResponse.json(
      { error: "Failed to validate instagram handle" },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}

