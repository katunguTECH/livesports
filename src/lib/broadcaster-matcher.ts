// src/lib/broadcaster-matcher.ts
import { getPrisma } from "./prisma";
import type { Fixture } from "./api";

export interface MatchedBroadcaster {
  countryCode: string;
  name: string;
  affiliateUrl: string;
  logoUrl: string | null;
}

const DB_SPORT: Record<string, string> = {
  soccer: "football",
  football: "american-football",
  basketball: "basketball",
  baseball: "baseball",
  hockey: "hockey",
  tennis: "tennis",
  mma: "mma",
  golf: "golf",
  rugby: "rugby",
};

function dbSport(espnSport: string): string {
  return DB_SPORT[espnSport] ?? espnSport;
}

function pairKey(sport: string, leagueId: number): string {
  return `${sport}|${leagueId}`;
}

function sortAndMap(
  mappings: any[],
  userCountryCode: string
): MatchedBroadcaster[] {
  const user = userCountryCode.toUpperCase();
  return mappings
    .map((m) => ({
      countryCode: m.countryCode,
      name: m.broadcaster.name,
      affiliateUrl: m.broadcaster.affiliateUrl,
      logoUrl: m.broadcaster.logoUrl,
    }))
    .sort((a, b) => {
      if (a.countryCode === user) return -1;
      if (b.countryCode === user) return 1;
      if (a.countryCode === "GLOBAL") return -1;
      if (b.countryCode === "GLOBAL") return 1;
      return a.countryCode.localeCompare(b.countryCode);
    });
}

function fallbackFromEspn(fixture: Fixture): MatchedBroadcaster[] {
  return fixture.espnBroadcasts
    .filter((b) => b.name)
    .map((b) => ({
      countryCode: "US",
      name: b.name,
      affiliateUrl: "#",
      logoUrl: null,
    }));
}

export async function getBroadcastersForFixtures(
  fixtures: Fixture[],
  userCountryCode: string
): Promise<Map<string, MatchedBroadcaster[]>> {
  const out = new Map<string, MatchedBroadcaster[]>();
  if (fixtures.length === 0) return out;

  const sports = Array.from(new Set(fixtures.map((f) => dbSport(f.sport))));
  const leagueIds = Array.from(new Set(fixtures.map((f) => f.leagueId)));

  let allMappings: any[] = [];
  try {
    const prisma = getPrisma();
    allMappings = await prisma.leagueBroadcasterMapping.findMany({
      where: {
        sport: { in: sports },
        leagueId: { in: leagueIds },
      },
      include: { broadcaster: true },
    });
  } catch (err) {
    console.error("Batch DB lookup failed:", err);
  }

  const grouped = new Map<string, any[]>();
  for (const m of allMappings) {
    const k = pairKey(m.sport, m.leagueId);
    const arr = grouped.get(k) ?? [];
    arr.push(m);
    grouped.set(k, arr);
  }

  for (const f of fixtures) {
    const k = pairKey(dbSport(f.sport), f.leagueId);
    const mappings = grouped.get(k) ?? [];
    out.set(
      f.id,
      mappings.length === 0 ? fallbackFromEspn(f) : sortAndMap(mappings, userCountryCode)
    );
  }

  return out;
}

export async function getBroadcastersForFixture(
  fixture: Fixture,
  userCountryCode: string
): Promise<MatchedBroadcaster[]> {
  const map = await getBroadcastersForFixtures([fixture], userCountryCode);
  return map.get(fixture.id) ?? [];
}