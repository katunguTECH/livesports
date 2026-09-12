// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create broadcasters — replace affiliateUrl with your tracked links later
  const dazn = await prisma.broadcaster.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "DAZN",
      logoUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/DAZN_Logo.svg/512px-DAZN_Logo.svg.png",
      affiliateUrl: "https://www.dazn.com/",
    },
  });

  const fubo = await prisma.broadcaster.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "FuboTV",
      logoUrl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/FuboTV_logo.svg/512px-FuboTV_logo.svg.png",
      affiliateUrl: "https://www.fubo.tv/",
    },
  });

  console.log("Created broadcasters:", dazn.name, fubo.name);

  // Premier League (API-Football league ID: 39)
  await prisma.leagueBroadcasterMapping.upsert({
    where: { leagueId_countryCode: { leagueId: 39, countryCode: "GB" } },
    update: { broadcasterId: dazn.id },
    create: {
      leagueId: 39,
      leagueName: "Premier League",
      countryCode: "GB",
      broadcasterId: dazn.id,
      directUrl: "https://www.dazn.com/en-GB/home",
    },
  });

  await prisma.leagueBroadcasterMapping.upsert({
    where: { leagueId_countryCode: { leagueId: 39, countryCode: "US" } },
    update: { broadcasterId: fubo.id },
    create: {
      leagueId: 39,
      leagueName: "Premier League",
      countryCode: "US",
      broadcasterId: fubo.id,
      directUrl: "https://www.fubo.tv/lp/soccer/",
    },
  });

  await prisma.leagueBroadcasterMapping.upsert({
    where: { leagueId_countryCode: { leagueId: 39, countryCode: "KE" } },
    update: { broadcasterId: dazn.id },
    create: {
      leagueId: 39,
      leagueName: "Premier League",
      countryCode: "KE",
      broadcasterId: dazn.id,
      directUrl: "https://www.dazn.com/",
    },
  });

  // Champions League (API-Football league ID: 2) — US
  await prisma.leagueBroadcasterMapping.upsert({
    where: { leagueId_countryCode: { leagueId: 2, countryCode: "US" } },
    update: { broadcasterId: fubo.id },
    create: {
      leagueId: 2,
      leagueName: "UEFA Champions League",
      countryCode: "US",
      broadcasterId: fubo.id,
      directUrl: "https://www.fubo.tv/lp/soccer/",
    },
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });