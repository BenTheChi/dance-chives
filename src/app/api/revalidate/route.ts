import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidation API endpoint for on-demand cache invalidation.
 * Use when a new event has been added externally (e.g. webhook, CMS) to refresh
 * event cards, city filters/lists, and watch filter caches.
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
    const body =
      request.headers.get("content-type")?.includes("application/json")
        ? await request.json().catch(() => null)
        : null;
    const eventId =
      body &&
      typeof body === "object" &&
      "eventId" in body &&
      typeof body.eventId === "string"
        ? body.eventId.trim()
        : "";
    const citySlug =
      body &&
      typeof body === "object" &&
      "citySlug" in body &&
      typeof body.citySlug === "string"
        ? body.citySlug.trim()
        : "";

    const pathsToRevalidate = [
      "/",
      "/events",
      "/watch",
      "/calendar",
      "/cities",
      "/api/watch/filters/cities",
      "/api/watch/filters/styles",
    ];

    if (eventId) {
      pathsToRevalidate.push(`/events/${eventId}`);
    }
    if (citySlug) {
      pathsToRevalidate.push(`/cities/${citySlug}`);
    }

    // Revalidate home page (upcoming events + watch past events cards)
    for (const path of pathsToRevalidate) {
      revalidatePath(path);
    }

    // Keep tag caches in sync with event/city updates.
    revalidateTag("watch-sections", "");
    revalidateTag("event-styles", "");

    return NextResponse.json({
      revalidated: true,
      paths: pathsToRevalidate,
      tags: ["watch-sections", "event-styles"],
    });
  } catch (error) {
    console.error("Revalidation failed:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
