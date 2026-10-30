import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function normalizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim();

  // Strip a pasted "DATABASE_URL=" prefix
  s = s.replace(/^DATABASE_URL\s*=\s*/, "");

  // Strip surrounding quotes
  s = s.replace(/^["']|["']$/g, "");

  // postgres:// -> postgresql://
  s = s.replace(/^postgres:\/\//, "postgresql://");

  // Remove channel_binding (Prisma's pg driver does not support it)
  s = s.replace(/[&?]channel_binding=[^&]*/g, "");

  // Ensure sslmode is present
  if (!/[?&]sslmode=/.test(s)) {
    s += (s.includes("?") ? "&" : "?") + "sslmode=require";
  }

  return s;
}

function createClient(): PrismaClient {
  const connectionString = normalizeDbUrl(
    process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL
  );

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