import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getEventTeamMembers,
  addTeamMember,
  removeTeamMember,
  isEventCreator,
  isTeamMember,
} from "@/db/queries/team-member";
import { getUser } from "@/db/queries/user";
import { canUpdateEvent } from "@/lib/utils/auth-utils";
import { getEvent } from "@/db/queries/event";

// GET - Get team members for an event
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    // Get team member IDs
    const teamMemberIds = await getEventTeamMembers(eventId);

    // Fetch user objects for each team member
    const teamMembers = await Promise.all(
      teamMemberIds.map(async (id) => {
        const user = await getUser(id);
        if (!user) return null;
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName || "",
        };
      })
    );

    // Filter out null values
    const validTeamMembers = teamMembers.filter(
      (member): member is NonNullable<typeof member> => member !== null
    );

    return NextResponse.json({ teamMembers: validTeamMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST - Add a team member to an event
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventId, userId } = body;

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "eventId and userId are required" },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await getEvent(
      eventId,
      session.user.id,
      session.user.auth ?? 0
    );
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has permission to add team members
    const authLevel = session.user.auth ?? 0;
    const isEventTeamMember = await isTeamMember(eventId, session.user.id);
    const hasPermission = canUpdateEvent(
      authLevel,
      {
        eventId,
        eventCreatorId: event.eventDetails.creatorId,
        isTeamMember: isEventTeamMember,
      },
      session.user.id
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You do not have permission to add team members" },
        { status: 403 }
      );
    }

    // Add team member
    await addTeamMember(eventId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a team member from an event
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventId, userId } = body;

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "eventId and userId are required" },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await getEvent(
      eventId,
      session.user.id,
      session.user.auth ?? 0
    );
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has permission to remove team members
    const authLevel = session.user.auth ?? 0;
    const isEventTeamMember = await isTeamMember(eventId, session.user.id);
    const hasPermission = canUpdateEvent(
      authLevel,
      {
        eventId,
        eventCreatorId: event.eventDetails.creatorId,
        isTeamMember: isEventTeamMember,
      },
      session.user.id
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "You do not have permission to remove team members" },
        { status: 403 }
      );
    }

    // Don't allow removing the creator
    const isCreator = await isEventCreator(eventId, userId);
    if (isCreator) {
      return NextResponse.json(
        { error: "Cannot remove the event creator" },
        { status: 400 }
      );
    }

    // Remove team member
    await removeTeamMember(eventId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
