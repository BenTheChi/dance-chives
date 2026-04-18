import "server-only";
import { unstable_cache } from "next/cache";
import { DANCE_STYLES } from "./dance-styles";

// Cached for 24 hours. Revalidate by calling revalidateTag("dance-styles")
// or by restarting the server. Adding a new style = run sync script + revalidate.
export const getDanceStyles = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const { prisma } = await import("@/lib/primsa");
      const rows = await (prisma as any).danceStyle.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      });
      return rows.map((r: { name: string }) => r.name);
    } catch {
      return [...DANCE_STYLES];
    }
  },
  ["dance-styles"],
  { revalidate: 86400, tags: ["dance-styles"] }
);
