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

  const dazn = await prisma.broadcaster.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "DAZN",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/DAZN_Logo.svg/512px-DAZN_Logo.svg.png",
      affiliateUrl: "https://www.dazn.com/",
    },
  });

  const fubo = await prisma.broadcaster.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "FuboTV",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/FuboTV_logo.svg/512px-FuboTV_logo.svg.png",
      affiliateUrl: "https://www.fubo.tv/",
    },
  });

  const espn = await prisma.broadcaster.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: "ESPN+", affiliateUrl: "https://plus.espn.com/" },
  });

  const peacock = await prisma.broadcaster.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, name: "Peacock", affiliateUrl: "https://www.peacocktv.com/" },
  });

  const paramount = await prisma.broadcaster.upsert({
    where: { id: 5 },
    update: {},
    create: { id: 5, name: "Paramount+", affiliateUrl: "https://www.paramountplus.com/" },
  });

  const sky = await prisma.broadcaster.upsert({
    where: { id: 6 },
    update: {},
    create: { id: 6, name: "Sky Sports", affiliateUrl: "https://www.skysports.com/" },
  });

  const tnt = await prisma.broadcaster.upsert({
    where: { id: 7 },
    update: {},
    create: { id: 7, name: "TNT Sports", affiliateUrl: "https://www.tntsports.co.uk/" },
  });

  const canal = await prisma.broadcaster.upsert({
    where: { id: 8 },
    update: {},
    create: { id: 8, name: "Canal+", affiliateUrl: "https://www.canalplus.com/" },
  });

  const supersport = await prisma.broadcaster.upsert({
    where: { id: 9 },
    update: {},
    create: { id: 9, name: "SuperSport", affiliateUrl: "https://supersport.com/" },
  });

  const starTimes = await prisma.broadcaster.upsert({
    where: { id: 10 },
    update: {},
    create: { id: 10, name: "StarTimes", affiliateUrl: "https://www.startimestv.com/" },
  });

  const youtube = await prisma.broadcaster.upsert({
    where: { id: 11 },
    update: {},
    create: { id: 11, name: "YouTube", affiliateUrl: "https://www.youtube.com/" },
  });

  console.log("Created broadcasters:", dazn.name, fubo.name, espn.name, peacock.name, paramount.name, sky.name, tnt.name, canal.name, supersport.name, starTimes.name, youtube.name);

  const map = (
    sport: string,
    leagueId: number,
    leagueName: string,
    countryCode: string,
    broadcasterId: number,
    directUrl?: string
  ) =>
    prisma.leagueBroadcasterMapping.upsert({
      where: { sport_leagueId_countryCode: { sport, leagueId, countryCode } },
      update: { broadcasterId },
      create: { sport, leagueId, leagueName, countryCode, broadcasterId, directUrl },
    });

  await map("football", 39, "Premier League", "GB", sky.id);
  await map("football", 39, "Premier League", "US", peacock.id);
  await map("football", 39, "Premier League", "KE", supersport.id, "https://supersport.com/football");
  await map("football", 39, "Premier League", "NG", supersport.id);
  await map("football", 39, "Premier League", "ZA", supersport.id);
  await map("football", 39, "Premier League", "GLOBAL", dazn.id);

  await map("football", 2, "UEFA Champions League", "US", paramount.id);
  await map("football", 2, "UEFA Champions League", "GB", tnt.id);
  await map("football", 2, "UEFA Champions League", "KE", supersport.id);
  await map("football", 2, "UEFA Champions League", "GLOBAL", dazn.id);

  await map("football", 3, "UEFA Europa League", "US", paramount.id);
  await map("football", 3, "UEFA Europa League", "GB", tnt.id);
  await map("football", 3, "UEFA Europa League", "GLOBAL", dazn.id);

  await map("football", 140, "La Liga", "US", espn.id);
  await map("football", 140, "La Liga", "GB", sky.id);
  await map("football", 140, "La Liga", "KE", supersport.id);
  await map("football", 140, "La Liga", "GLOBAL", dazn.id);

  await map("football", 135, "Serie A", "US", paramount.id);
  await map("football", 135, "Serie A", "GB", tnt.id);
  await map("football", 135, "Serie A", "GLOBAL", dazn.id);

  await map("football", 78, "Bundesliga", "US", espn.id);
  await map("football", 78, "Bundesliga", "GB", sky.id);
  await map("football", 78, "Bundesliga", "GLOBAL", dazn.id);

  await map("football", 61, "Ligue 1", "US", fubo.id);
  await map("football", 61, "Ligue 1", "GB", tnt.id);
  await map("football", 61, "Ligue 1", "FR", canal.id);
  await map("football", 61, "Ligue 1", "GLOBAL", dazn.id);

  await map("football", 88, "Eredivisie", "US", espn.id);
  await map("football", 88, "Eredivisie", "GLOBAL", dazn.id);

  await map("football", 94, "Primeira Liga", "US", fubo.id);
  await map("football", 94, "Primeira Liga", "GLOBAL", dazn.id);

  await map("football", 40, "EFL Championship", "GB", sky.id);
  await map("football", 40, "EFL Championship", "US", espn.id);
  await map("football", 40, "EFL Championship", "GLOBAL", dazn.id);

  await map("football", 253, "MLS", "US", espn.id);
  await map("football", 253, "MLS", "GLOBAL", dazn.id);

  await map("football", 262, "Liga MX", "US", fubo.id);
  await map("football", 262, "Liga MX", "GLOBAL", dazn.id);

  await map("football", 71, "Brasileirao", "US", fubo.id);
  await map("football", 71, "Brasileirao", "BR", canal.id);
  await map("football", 71, "Brasileirao", "GLOBAL", dazn.id);

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