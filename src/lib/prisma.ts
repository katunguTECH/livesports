import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function normalizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim();

  s = s.replace(/^DATABASE_URL\s*=\s*/, "");
  s = s.replace(/^["']|["']$/g, "");
  s = s.replace(/^postgres:\/\//, "postgresql://");
  s = s.replace(/[&?]channel_binding=[^&]*/g, "");

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
    max: 10,
  });

  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}