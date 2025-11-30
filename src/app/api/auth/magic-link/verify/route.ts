import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/primsa";
import { consumeMagicLinkToken } from "@/lib/utils/magicLink";
import { signIn } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (typeof token !== "string" || !token) {
      return NextResponse.json(
        { error: "Invalid or expired link." },
        { status: 400 }
      );
    }

    const consumed = await consumeMagicLinkToken(token);

    if (!consumed) {
      return NextResponse.json(
        { error: "Invalid or expired link." },
        { status: 400 }
      );
    }

    const email = consumed.email.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
        },
      });
    }

    const needsProfile = !user.accountVerified;

    // Establish a NextAuth session via the magic-link credentials provider
    await signIn("magic-link", {
      userId: user.id,
      redirect: false,
    });

    const redirectPath = needsProfile ? "/signup" : "/dashboard";

    return NextResponse.json({
      status: "ok",
      needsProfile,
      redirectPath,
    });
  } catch (error) {
    console.error("Error verifying magic link:", error);
    return NextResponse.json(
      { error: "Invalid or expired link." },
      { status: 400 }
    );
  }
}


