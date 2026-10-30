import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const raw = process.env.DATABASE_URL ?? "";
  const hasUrl = raw.length > 0;
  const startsPostgresql = raw.startsWith("postgresql://");
  const hasPooler = raw.includes("-pooler");
  const hasChannelBinding = raw.includes("channel_binding");
  const hasExampleHost = raw.includes("db.example.com");
  const hasQuotes = raw.startsWith('"') || raw.endsWith('"');

  // Extract hostname without password
  let host = "(could not parse)";
  const match = raw.match(/postgres(?:ql)?:\/\/[^:]+:[^@]+@([^/?]+)/);
  if (match) host = match[1];

  let dbOk = false;
  let dbError = null;
  let mappingCount = null;

  try {
    const prisma = getPrisma();
    mappingCount = await prisma.leagueBroadcasterMapping.count();
    dbOk = true;
  } catch (e: any) {
    dbError = e?.message ?? String(e);
  }

  return NextResponse.json({
    hasUrl,
    startsPostgresql,
    hasPooler,
    hasChannelBinding,
    hasExampleHost,
    hasQuotes,
    host,
    dbOk,
    dbError,
    mappingCount,
  });
}