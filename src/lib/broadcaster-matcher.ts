// src/lib/broadcaster-matcher.ts
import { getPrisma } from "./prisma";
import type { Fixture } from "./api";

export interface MatchedBroadcaster {
  countryCode: string;
  name: string;
  affiliateUrl: string;
  logoUrl: string | null;
}

// Your database stores soccer as "football" (legacy API-Sports naming).
const DB_SPORT: Record<string, string> = {
  soccer: "football",          // legacy: 41 existing rows use "football"
  football: "american-football", // NFL gets its own key
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

export async function getBroadcastersForFixture(
  fixture: Fixture,
  userCountryCode: string
): Promise<MatchedBroadcaster[]> {
  const prisma = getPrisma();

  let mappings: any[] = [];
  try {
    mappings = await prisma.leagueBroadcasterMapping.findMany({
      where: {
        sport: dbSport(fixture.sport),
        leagueId: fixture.leagueId,
      },
      include: { broadcaster: true },
    });
  } catch (err) {
    console.error(`DB lookup failed for ${fixture.id}:`, err);
  }

  if (mappings.length === 0) {
    // Fall back to ESPN's own broadcast list, if any
    return fixture.espnBroadcasts
      .filter((b) => b.name)
      .map((b) => ({
        countryCode: "US",
        name: b.name,
        affiliateUrl: "#",
        logoUrl: null,
      }));
  }

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