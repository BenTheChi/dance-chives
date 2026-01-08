import { getUsers } from "@/db/queries/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const keyWord = searchParams.get("keyword");

  const res = await getUsers(keyWord);

  const data = res.map((record) => ({
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    instagram: record.instagram || null,
    claimed: record.claimed ?? true,
    avatar: record.avatar || null,
    image: record.image || null,
  }));

  return NextResponse.json({ data });
}
