import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, getEventPictures } from "@/db/queries/event";
import { auth } from "@/auth";
import { deleteFromGCloudStorage } from "@/lib/GCloud";
import { prisma } from "@/lib/primsa";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
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
    // First delete all the pictures associated with the event
    const pictures = await getEventPictures(id);

    await Promise.all(
      pictures.map(async (url) => {
        return deleteFromGCloudStorage(url);
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
    try {
      await prisma.event.deleteMany({
        where: { eventId: id },
      });
    } catch (dbError) {
      // Log error but don't fail the request - event is already deleted from Neo4j
      console.error("Failed to delete PostgreSQL Event record:", dbError);
    }

    return NextResponse.json({ message: "Event deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete event" },
      { status: 500 }
    );
  }
}
