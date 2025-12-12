import { prisma } from "@/lib/primsa";

export type UserCardRow = {
  id: string;
  displayName: string;
  username: string;
  image?: string | null;
  styles?: string[];
  city: string;
};

export async function getUserCards(): Promise<UserCardRow[]> {
  const rows = await prisma.userCard.findMany({
    orderBy: [{ displayName: "asc" }, { username: "asc" }],
  });

  return rows.map((r) => ({
    id: r.userId,
    displayName: r.displayName,
    username: r.username,
    image: r.imageUrl ?? null,
    styles: r.styles ?? [],
    city: r.cityName ?? "",
  }));
}
