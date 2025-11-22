import { NextRequest, NextResponse } from "next/server";
import { deleteCompetition, getCompetitionPictures, getCompetition as getCompetitionQuery } from "@/db/queries/competition";
import { auth } from "@/auth";
import { deleteFromR2 } from "@/lib/R2";
import { prisma } from "@/lib/primsa";
import { canDeleteCompetition } from "@/lib/utils/auth-utils";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { message: "Competition ID is required" },
      { status: 400 }
    );
  }

  try {
    // Check authorization - get competition to check creator ID
    const competition = await getCompetitionQuery(id);
    if (!competition) {
      return NextResponse.json(
        { message: "Competition not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this competition
    if (!session.user.auth) {
      return NextResponse.json(
        { message: "User authorization level not found" },
        { status: 403 }
      );
    }

    const hasPermission = canDeleteCompetition(
      session.user.auth,
      {
        eventId: id,
        eventCreatorId: competition.eventDetails.creatorId,
      },
      session.user.id
    );

    if (!hasPermission) {
      return NextResponse.json(
        { message: "You do not have permission to delete this competition" },
        { status: 403 }
      );
    }

    // First delete all the pictures associated with the competition
    const pictures = await getCompetitionPictures(id);

    await Promise.all(
      pictures.map(async (url) => {
        return deleteFromR2(url);
      })
    );

    const result = await deleteCompetition(id);

    if (!result) {
      return NextResponse.json(
        { message: "Failed to delete competition" },
        { status: 500 }
      );
    }

    // Delete corresponding PostgreSQL Event record
    // Using deleteMany to handle cases where record might not exist
    await prisma.event.deleteMany({
      where: { eventId: id },
    });

    return NextResponse.json({ message: "Competition deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete competition" },
      { status: 500 }
    );
  }
}
