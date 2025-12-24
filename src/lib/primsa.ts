// Note: This module is server-only and uses Node.js-specific APIs (Pool, PrismaPg adapter)
// Scripts (seed files, etc.) can still import this as they run in Node.js environment
// Client-side usage is prevented by Next.js build-time checks and the fact that
// this module uses Node.js-specific APIs (Pool, PrismaPg adapter)

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
