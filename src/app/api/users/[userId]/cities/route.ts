import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import { AUTH_LEVELS, canUpdateUserCities } from "@/lib/utils/auth-utils";

/**
 * Update user cities and global flag
 * Only admins and super admins can access this endpoint
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userAuthLevel = session.user.auth || 0;

  // Only admins and super admins can update user cities
  if (!canUpdateUserCities(userAuthLevel)) {
    return NextResponse.json(
      { error: "Insufficient permissions. Admin or Super Admin required." },
      { status: 403 }
    );
  }

  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { userId } = resolvedParams;
    const { cityIds, allCityAccess } = await request.json();

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Validate that user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, auth: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use transaction to update user and cities atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update user's allCityAccess flag if provided
      const updateData: { allCityAccess?: boolean } = {};
      if (typeof allCityAccess === "boolean") {
        updateData.allCityAccess = allCityAccess;
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          auth: true,
          allCityAccess: true,
        },
      });

      // Update cities if cityIds array is provided
      if (Array.isArray(cityIds)) {
        // Delete existing cities
        await tx.city.deleteMany({
          where: { userId },
        });

        // Create new cities
        if (cityIds.length > 0) {
          await tx.city.createMany({
            data: cityIds.map((cityId: string) => ({
              userId,
              cityId,
            })),
          });
        }

        // Fetch updated cities
        const cities = await tx.city.findMany({
          where: { userId },
          select: { id: true, cityId: true },
        });

        return {
          user: updatedUser,
          cities: cities.map((c) => c.cityId),
        };
      }

      // If cityIds not provided, just return user with existing cities
      const cities = await tx.city.findMany({
        where: { userId },
        select: { id: true, cityId: true },
      });

      return {
        user: updatedUser,
        cities: cities.map((c) => c.cityId),
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Failed to update user cities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get user cities
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { userId } = resolvedParams;

    // Users can view their own cities, or admins can view any user's cities
    const userAuthLevel = session.user.auth || 0;
    const isOwnProfile = session.user.id === userId;
    const isAdmin = userAuthLevel >= AUTH_LEVELS.ADMIN;

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        auth: true,
        allCityAccess: true,
        cities: {
          select: { id: true, cityId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        auth: user.auth,
        allCityAccess: user.allCityAccess,
      },
      cities: user.cities.map((c) => c.cityId),
    });
  } catch (error) {
    console.error("Failed to get user cities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
