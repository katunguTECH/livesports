// src/lib/broadcaster-matcher.ts
import { prisma } from "./prisma";
import type { Fixture } from "./api";

export async function getBroadcasterForFixture(fixture: Fixture, countryCode: string) {
  const mapping = await prisma.leagueBroadcasterMapping.findUnique({
    where: {
      leagueId_countryCode: {
        leagueId: fixture.league.id,
        countryCode: countryCode.toUpperCase(),
      },
    },
    include: { broadcaster: true },
  });

  return mapping?.broadcaster ?? null;
}