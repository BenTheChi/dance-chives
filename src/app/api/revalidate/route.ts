import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidation API endpoint for on-demand cache invalidation.
 * Use when a new event has been added externally (e.g. webhook, CMS) to refresh
 * event cards on the home page and events page.
 *
 * Requires REVALIDATION_TOKEN in env. Pass via header:
 *   Authorization: Bearer <token>
 *   or
 *   x-revalidate-token: <token>
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = process.env.REVALIDATION_TOKEN;

  if (!token || token.trim() === "") {
    return NextResponse.json(
      { error: "Revalidation not configured" },
      { status: 501 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const tokenHeader = request.headers.get("x-revalidate-token");
  const providedToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (tokenHeader ?? null);

  if (!providedToken || providedToken !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Revalidate home page (upcoming events + watch past events cards)
    revalidatePath("/");
    // Revalidate events page (all event cards)
    revalidatePath("/events");
    // Revalidate watch page (event list/sections)
    revalidatePath("/watch");

    return NextResponse.json({
      revalidated: true,
      paths: ["/", "/events", "/watch"],
    });
  } catch (error) {
    console.error("Revalidation failed:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
