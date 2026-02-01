import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/primsa";
import { VideoFilters } from "@/types/video-filter";

const CACHE_CONTROL_HEADER =
  "public, s-maxage=60, stale-while-revalidate=120";

type FilterPayload = {
  yearFrom?: number;
  yearTo?: number;
  cities?: string[];
  styles?: string[];
  finalsOnly?: boolean;
  noPrelims?: boolean;
  sortOrder?: "asc" | "desc";
};

function sanitizeFilters(payload: FilterPayload): VideoFilters {
  const filters: VideoFilters = {};

  if (
    typeof payload?.yearFrom === "number" &&
    Number.isFinite(payload.yearFrom)
  ) {
    filters.yearFrom = Math.floor(payload.yearFrom);
  }

  if (
    typeof payload?.yearTo === "number" &&
    Number.isFinite(payload.yearTo)
  ) {
    filters.yearTo = Math.floor(payload.yearTo);
  }

  if (Array.isArray(payload?.cities)) {
    filters.cities = payload.cities.filter(
      (city: unknown): city is string => typeof city === "string" && city.trim() !== "",
    );
  }

  if (Array.isArray(payload?.styles)) {
    filters.styles = payload.styles.filter(
      (style: unknown): style is string =>
        typeof style === "string" && style.trim() !== "",
    );
  }

  if (payload?.finalsOnly === true) {
    filters.finalsOnly = true;
  }

  if (payload?.noPrelims === true) {
    filters.noPrelims = true;
  }

  if (payload?.sortOrder === "asc" || payload?.sortOrder === "desc") {
    filters.sortOrder = payload.sortOrder;
  }

  return filters;
}

async function getAuthenticatedSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { filterPreferences: true },
    });
    return NextResponse.json(user?.filterPreferences ?? null, {
      headers: {
        "Cache-Control": CACHE_CONTROL_HEADER,
      },
    });
  } catch (error) {
    console.error("Error fetching saved filters:", error);
    return NextResponse.json(
      { error: "Failed to load preferences" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as FilterPayload;
    const filters = sanitizeFilters(payload);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { filterPreferences: filters },
    });
    return NextResponse.json({ filterPreferences: filters });
  } catch (error) {
    console.error("Error saving filter preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { filterPreferences: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing filter preferences:", error);
    return NextResponse.json(
      { error: "Failed to clear preferences" },
      { status: 500 },
    );
  }
}
