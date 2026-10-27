// src/lib/broadcaster-matcher.ts
import { getPrisma } from "./prisma";
import type { Fixture } from "./api";

export async function getBroadcasterForFixture(
  fixture: Fixture,
  countryCode: string
) {
  const prisma = getPrisma();
  const leagueId = fixture.league.id;
  const sport = "football";

  const specific = await prisma.leagueBroadcasterMapping.findUnique({
    where: {
      sport_leagueId_countryCode: {
        sport,
        leagueId,
        countryCode: countryCode.toUpperCase(),
      },
    },
    include: { broadcaster: true },
  });
  if (specific) return specific.broadcaster;

  const globalMapping = await prisma.leagueBroadcasterMapping.findUnique({
    where: {
      sport_leagueId_countryCode: {
        sport,
        leagueId,
        countryCode: "GLOBAL",
      },
    },
    include: { broadcaster: true },
  });
  return globalMapping?.broadcaster ?? null;
}