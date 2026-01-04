import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, getEventImages } from "@/db/queries/event";
import { getEvent } from "@/db/queries/event";
import { auth } from "@/auth";
import { deleteFromR2 } from "@/lib/R2";
import { prisma } from "@/lib/primsa";
import { canDeleteEvent } from "@/lib/utils/auth-utils";
import { revalidatePath } from "next/cache";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { message: "Event ID is required" },
      { status: 400 }
    );
  }

  try {
    // Check authorization - get event to check creator ID
    const event = await getEvent(
      id,
      session.user.id,
      session.user.auth ?? 0
    );
    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this event
    if (!session.user.auth) {
      return NextResponse.json(
        { message: "User authorization level not found" },
        { status: 403 }
      );
    }

    const hasPermission = canDeleteEvent(
      session.user.auth,
      {
        eventId: id,
        eventCreatorId: event.eventDetails.creatorId,
      },
      session.user.id
    );

    if (!hasPermission) {
      return NextResponse.json(
        { message: "You do not have permission to delete this event" },
        { status: 403 }
      );
    }

    // First delete all the pictures associated with the event
    const pictures = await getEventImages(id);

    await Promise.all(
      pictures.map(async (url) => {
        return deleteFromR2(url);
      })
    );

    const result = await deleteEvent(id);

    if (!result) {
      return NextResponse.json(
        { message: "Failed to delete event" },
        { status: 500 }
      );
    }

    // Delete corresponding PostgreSQL Event record
    // Using deleteMany to handle cases where record might not exist
    await prisma.event.deleteMany({
      where: { eventId: id },
    });

    // Revalidate events list page to reflect deleted event
    revalidatePath("/events");
    // Also revalidate the individual event page (in case it was cached)
    revalidatePath(`/events/${id}`);

    return NextResponse.json({ message: "Event deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete event" },
      { status: 500 }
    );
  }
}
