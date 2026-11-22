import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [visits, clicks] = await Promise.all([
    prisma.siteVisit.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.linkClick.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  const totalVisits = visits.length;
  const totalClicks = clicks.length;
  const uniqueIps = new Set(visits.map((v) => v.ip)).size;
  const uniqueCountries = new Set(visits.map((v) => v.country).filter(Boolean)).size;

  const countryCount: Record<string, number> = {};
  for (const v of visits) {
    const c = v.country ?? "Unknown";
    countryCount[c] = (countryCount[c] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCount)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const gameCount: Record<string, number> = {};
  for (const c of clicks) {
    if (c.fixtureId) gameCount[c.fixtureId] = (gameCount[c.fixtureId] ?? 0) + 1;
  }
  const topGames = Object.entries(gameCount)
    .map(([fixtureId, count]) => ({ fixtureId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const linkCount: Record<string, number> = {};
  for (const c of clicks) {
    const t = c.linkTitle ?? c.linkUrl;
    linkCount[t] = (linkCount[t] ?? 0) + 1;
  }
  const topLinks = Object.entries(linkCount)
    .map(([linkTitle, count]) => ({ linkTitle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    visits,
    clicks,
    totals: { totalVisits, totalClicks, uniqueIps, uniqueCountries },
    topCountries,
    topGames,
    topLinks,
  });
}