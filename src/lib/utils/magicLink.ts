import { prisma } from "@/lib/primsa";
import crypto from "crypto";

const DEFAULT_TTL_MINUTES = 15;

interface GenerateMagicLinkTokenParams {
  email: string;
  userId?: string | null;
  ttlMinutes?: number;
}

interface ConsumedMagicLink {
  email: string;
  userId: string | null;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function generateMagicLinkToken(
  params: GenerateMagicLinkTokenParams
): Promise<string> {
  const { email, userId = null, ttlMinutes = DEFAULT_TTL_MINUTES } = params;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  await prisma.magicLinkToken.create({
    data: {
      email,
      userId: userId ?? undefined,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function consumeMagicLinkToken(
  rawToken: string
): Promise<ConsumedMagicLink | null> {
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);

  const record = await prisma.magicLinkToken.findUnique({
    where: { tokenHash },
  });

  if (!record) {
    return null;
  }

  const now = new Date();

  // If token is expired, delete and reject
  if (record.expiresAt <= now) {
    await prisma.magicLinkToken.delete({
      where: { tokenHash },
    });
    return null;
  }

  // On success, delete immediately so it cannot be reused
  await prisma.magicLinkToken.delete({
    where: { tokenHash },
  });

  return {
    email: record.email,
    userId: record.userId ?? null,
  };
}


