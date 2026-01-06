import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUser } from "@/db/queries/user";
import { generateCitySlug } from "@/lib/utils/city-slug";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ citySlug: null }, { status: 200 });
    }

    const user = await getUser(session.user.id);
    
    if (!user?.city) {
      return NextResponse.json({ citySlug: null }, { status: 200 });
    }

    const citySlug = user.city.slug || generateCitySlug(user.city);
    
    return NextResponse.json({ citySlug });
  } catch (error) {
    console.error("Error fetching user city:", error);
    return NextResponse.json(
      { error: "Failed to fetch user city" },
      { status: 500 }
    );
  }
}

