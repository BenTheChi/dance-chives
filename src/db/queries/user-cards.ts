import { prisma } from "@/lib/primsa";
import { UserSearchItem } from "@/types/user";

export type UserCardRow = {
  id: string;
  displayName: string;
  username: string;
  image?: string | null;
  styles?: string[];
  city: string;
  claimed: boolean;
};

export async function getUserCards(): Promise<UserCardRow[]> {
  const rows = await prisma.userCard.findMany({
    orderBy: [{ displayName: "asc" }, { username: "asc" }],
  });

  // Get all user IDs to fetch claimed status
  const userIds = rows.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, claimed: true },
  });

  // Create a map for quick lookup
  const userClaimedMap = new Map(
    users.map((u) => [u.id, u.claimed ?? true])
  );

  return rows.map((r) => ({
    id: r.userId,
    displayName: r.displayName,
    username: r.username,
    image: r.imageUrl ?? null,
    styles: r.styles ?? [],
    city: r.cityName ?? "",
    claimed: userClaimedMap.get(r.userId) ?? true,
  }));
}

/**
 * Enrich UserSearchItem array with city and styles from Postgres UserCard table.
 * Looks up users by their ID and adds city/styles data.
 */
export async function enrichUsersWithCardData(
  users: UserSearchItem[]
): Promise<UserSearchItem[]> {
  if (!users || users.length === 0) return users;

  // Get unique user IDs
  const userIds = users
    .map((u) => u.id)
    .filter((id): id is string => id !== undefined && id !== null);

  if (userIds.length === 0) return users;

  // Fetch user card data from Postgres
  const userCards = await prisma.userCard.findMany({
    where: {
      userId: { in: userIds },
    },
    select: {
      userId: true,
      cityName: true,
      styles: true,
      imageUrl: true,
    },
  });

  // Create a map for quick lookup
  const userCardMap = new Map(
    userCards.map((uc) => [
      uc.userId,
      {
        city: uc.cityName ?? "",
        styles: uc.styles ?? [],
        image: uc.imageUrl,
      },
    ])
  );

  // Enrich users with card data
  return users.map((user) => {
    const cardData = user.id ? userCardMap.get(user.id) : undefined;
    return {
      ...user,
      city: cardData?.city ?? user.city ?? "",
      styles: cardData?.styles ?? user.styles ?? [],
      image: user.image || cardData?.image || null,
    };
  });
}

/**
 * Enrich a single user with city and styles from Postgres UserCard table.
 */
export async function enrichUserWithCardData(
  user: UserSearchItem
): Promise<UserSearchItem> {
  const enriched = await enrichUsersWithCardData([user]);
  return enriched[0];
}
