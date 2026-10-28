// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  // Locally, DATABASE_URL_DIRECT points at the non-pooler host.
  // In production (Vercel), only DATABASE_URL exists and it uses the pooler.
  const connectionString =
    process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
    max: 1,
  });

  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}