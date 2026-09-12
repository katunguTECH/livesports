// src/app/page.tsx
import { headers } from "next/headers";
import { getLiveAndUpcomingFixtures } from "@/lib/api";
import { getBroadcasterForFixture } from "@/lib/broadcaster-matcher";
import EventCard from "@/components/EventCard";
import RegionSelector from "@/components/RegionSelector";
import type { Fixture } from "@/lib/api";
import type { Broadcaster } from "@/generated/prisma/client";

export const revalidate = 60;

type FixtureWithBroadcaster = Fixture & { broadcaster: Broadcaster | null };

// API-Football league IDs of leagues you've seeded
const FEATURED_LEAGUES = new Set([
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  39,  // Premier League
  40,  // EFL Championship
  41,  // EFL League One
  42,  // EFL League Two
  45,  // FA Cup
  61,  // Ligue 1
  71,  // Brasileirao
  78,  // Bundesliga
  88,  // Eredivisie
  94,  // Primeira Liga
  135, // Serie A
  140, // La Liga
  141, // Segunda Division
  253, // MLS
  262, // Liga MX
]);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; showAll?: string }>;
}) {
  const params = await searchParams;
  const headersList = await headers();
  const detectedCountry = headersList.get("x-vercel-ip-country") ?? "KE";

  const countryCode = (params.region ?? detectedCountry).toUpperCase();
  const showAll = params.showAll === "1";

  let fixtures: Fixture[] = [];
  let fixturesWithBroadcasters: FixtureWithBroadcaster[] = [];
  let dataError: string | null = null;

  try {
    fixtures = await getLiveAndUpcomingFixtures();

    // Filter to featured leagues unless showAll is on
    const filtered = showAll
      ? fixtures
      : fixtures.filter((f) => FEATURED_LEAGUES.has(f.league.id));

    fixturesWithBroadcasters = await Promise.all(
      filtered.map(async (fixture) => {
        try {
          const broadcaster = await getBroadcasterForFixture(
            fixture,
            countryCode
          );
          return { ...fixture, broadcaster };
        } catch (err) {
          console.error(
            `Broadcaster lookup failed for fixture ${fixture.fixture.id}:`,
            err
          );
          return { ...fixture, broadcaster: null };
        }
      })
    );
  } catch (err) {
    dataError = err instanceof Error ? err.message : "Unknown error";
    console.error("Page data fetch failed:", err);
  }

  const live = fixturesWithBroadcasters.filter((f) =>
    ["1H", "2H", "HT", "ET", "LIVE"].includes(f.fixture.status.short)
  );

  const upcoming = fixturesWithBroadcasters.filter(
    (f) => f.fixture.status.short === "NS"
  );

  const toggleHref = showAll
    ? `/?region=${countryCode}`
    : `/?region=${countryCode}&showAll=1`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Live &amp; Upcoming Sport</h1>
      <p className="text-sm text-gray-500 mb-4">
        Detected region:{" "}
        <span className="font-semibold">{detectedCountry}</span>
        {" · "}Showing: <span className="font-semibold">{countryCode}</span>
      </p>

      <RegionSelector current={countryCode} />

      {dataError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          <strong>Data temporarily unavailable.</strong> {dataError}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-3">
        Total fixtures today: {fixtures.length} &middot; Live: {live.length}{" "}
        &middot; Upcoming: {upcoming.length}
        {!showAll && (
          <>
            {" "}&middot;{" "}
            <a href={toggleHref} className="text-blue-600 underline">
              Show all leagues
            </a>
          </>
        )}
        {showAll && (
          <>
            {" "}&middot;{" "}
            <a href={toggleHref} className="text-blue-600 underline">
              Featured leagues only
            </a>
          </>
        )}
      </p>

      {live.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Now ({live.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((f) => (
              <EventCard key={f.fixture.id} fixture={f} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500">
            No upcoming fixtures for this filter today.
            {!showAll && (
              <>
                {" "}Try{" "}
                <a href={toggleHref} className="text-blue-600 underline">
                  showing all leagues
                </a>
                .
              </>
            )}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 60).map((f) => (
              <EventCard key={f.fixture.id} fixture={f} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}