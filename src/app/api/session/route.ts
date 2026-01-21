import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, getEventImages, getEvent } from "@/db/queries/event";
import { auth } from "@/auth";
import { deleteFromR2 } from "@/lib/R2";
import { canDeleteEvent } from "@/lib/utils/auth-utils";
import { isTeamMember } from "@/db/queries/team-member";
import { prisma } from "@/lib/primsa";
import { searchEvents, searchAccessibleEvents } from "@/db/queries/event";
import { revalidatePath, revalidateTag } from "next/cache";
import { City } from "@/types/city";
import {
  getCitySlug,
  revalidateCalendarForSlugs,
} from "@/lib/server_actions/calendar_revalidation";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { message: "Event ID is required" },
      { status: 400 },
    );
  }

  try {
    // Check authorization - get event to check creator ID
    const eventData = await getEvent(
      id,
      session.user.id,
      session.user.auth ?? 0,
    );
    if (!eventData) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Check if user has permission to delete this event
    if (!session.user.auth) {
      return NextResponse.json(
        { message: "User authorization level not found" },
        { status: 403 },
      );
    }

    const isEventTeamMember = await isTeamMember(id, session.user.id);

    const hasPermission = canDeleteEvent(
      session.user.auth,
      {
        eventId: id,
        eventCreatorId: eventData.eventDetails.creatorId,
        isTeamMember: isEventTeamMember,
      },
      session.user.id,
    );

    if (!hasPermission) {
      return NextResponse.json(
        { message: "You do not have permission to delete this event" },
        { status: 403 },
      );
    }

    // First delete all the pictures associated with the event
    const pictures = await getEventImages(id);

    await Promise.all(
      pictures.map(async (url) => {
        return deleteFromR2(url);
      }),
    );

    const result = await deleteEvent(id);

    if (!result) {
      return NextResponse.json(
        { message: "Failed to delete event" },
        { status: 500 },
      );
    }

    // Delete corresponding PostgreSQL Event record
    await prisma.event.deleteMany({
      where: { eventId: id },
    });

    // Revalidate events list page to reflect deleted event
    revalidatePath("/events");
    // Also revalidate the individual event page (in case it was cached)
    revalidatePath(`/events/${id}`);
    // Revalidate TV page
    revalidatePath("/watch");
    revalidateTag("watch-sections", "");

    const citySlug = getCitySlug(
      eventData.eventDetails.city as City | undefined,
    );
    revalidateCalendarForSlugs([citySlug]);

    return NextResponse.json({ message: "Event deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete session" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const keyword = request.nextUrl.searchParams.get("keyword");
  const accessible = request.nextUrl.searchParams.get("accessible") === "true";

  try {
    if (accessible) {
      if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const authLevel = session.user.auth || 0;
      const results = await searchAccessibleEvents(
        session.user.id,
        authLevel,
        keyword || undefined,
      );

      return NextResponse.json({ data: results });
    } else {
      const results = await searchEvents(keyword || undefined);
      return NextResponse.json({ data: results });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to search sessions" },
      { status: 500 },
    );
  }
}
