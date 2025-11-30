import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/primsa";
import { generateMagicLinkToken } from "@/lib/utils/magicLink";
import { sendMagicLinkEmail } from "@/lib/email/magicLink";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const emailInput = body?.email;

    // Always respond with a neutral message to avoid email enumeration
    const genericResponse = NextResponse.json({
      message: "If that email exists, we'll send a link shortly.",
    });

    if (typeof emailInput !== "string") {
      return genericResponse;
    }

    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return genericResponse;
    }

    // Basic rate limiting: limit recent requests per email
    const now = new Date();
    const windowMinutes = 5;
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
    const maxPerWindow = 5;

    const recentCount = await prisma.magicLinkToken.count({
      where: {
        email,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (recentCount >= maxPerWindow) {
      return genericResponse;
    }

    const token = await generateMagicLinkToken({ email, ttlMinutes: 15 });
    const baseUrl = getBaseUrl();
    const magicLinkUrl = `${baseUrl}/login/magic?token=${encodeURIComponent(
      token
    )}`;

    await sendMagicLinkEmail({ email, magicLinkUrl });

    return genericResponse;
  } catch (error) {
    console.error("Error handling magic link request:", error);
    return NextResponse.json(
      {
        message:
          "Please check your inbox for a magic link. If you don't see it, please check your spam folder.",
      },
      { status: 200 }
    );
  }
}
