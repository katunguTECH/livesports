// src/lib/broadcaster-matcher.ts
import { getPrisma } from "./prisma";
import type { Fixture } from "./api";

export async function getBroadcasterForFixture(
  fixture: Fixture,
  countryCode: string
) {
  const prisma = getPrisma();
  const leagueId = fixture.league.id;

  // 1. Try user's specific country
  const specific = await prisma.leagueBroadcasterMapping.findUnique({
    where: {
      leagueId_countryCode: { leagueId, countryCode: countryCode.toUpperCase() },
    },
    include: { broadcaster: true },
  });
  if (specific) return specific.broadcaster;

  // 2. Fall back to GLOBAL (worldwide services)
  const globalMapping = await prisma.leagueBroadcasterMapping.findUnique({
    where: {
      leagueId_countryCode: { leagueId, countryCode: "GLOBAL" },
    },
    include: { broadcaster: true },
  });
  return globalMapping?.broadcaster ?? null;
}