// src/app/page.tsx
import { headers } from "next/headers";
import { Suspense } from "react";
import { getFixturesForSport } from "@/lib/api";
import { getBroadcastersForFixture } from "@/lib/broadcaster-matcher";
import EventCard from "@/components/EventCard";
import RegionSelector from "@/components/RegionSelector";
import SportTabs from "@/components/SportTabs";
import type { SportKey } from "@/lib/leagues";

export const revalidate = 300;

const VALID_SPORTS: SportKey[] = [
  "soccer",
  "basketball",
  "football",
  "baseball",
  "hockey",
];

type FixtureWithBroadcasters = Awaited<
  ReturnType<typeof getFixturesForSport>
>[number] & {
  broadcasters: Awaited<ReturnType<typeof getBroadcastersForFixture>>;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; sport?: string }>;
}) {
  const params = await searchParams;
  const headersList = await headers();
  const detectedCountry = headersList.get("x-vercel-ip-country") ?? "KE";

  const countryCode = (params.region ?? detectedCountry).toUpperCase();
  const sport: SportKey = VALID_SPORTS.includes(params.sport as SportKey)
    ? (params.sport as SportKey)
    : "soccer";

  let fixturesWithBroadcasters: FixtureWithBroadcasters[] = [];
  let dataError: string | null = null;
  let totalFetched = 0;

  try {
    const fixtures = await getFixturesForSport(sport);
    totalFetched = fixtures.length;

    const withB = await Promise.all(
      fixtures.map(async (fx) => {
        try {
          const broadcasters = await getBroadcastersForFixture(fx, countryCode);
          return { ...fx, broadcasters };
        } catch (err) {
          console.error(`Broadcaster lookup failed for ${fx.id}:`, err);
          return { ...fx, broadcasters: [] };
        }
      })
    );

    fixturesWithBroadcasters = withB;
  } catch (err) {
    dataError = err instanceof Error ? err.message : "Unknown error";
    console.error("Fixture fetch failed:", err);
  }

  const live = fixturesWithBroadcasters.filter((f) => f.status === "live");
  const scheduled = fixturesWithBroadcasters.filter(
    (f) => f.status === "scheduled"
  );
  const finished = fixturesWithBroadcasters.filter(
    (f) => f.status === "finished"
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Live and Upcoming Sport</h1>
      <p className="text-sm text-gray-500 mb-4">
        Detected region:{" "}
        <span className="font-semibold">{detectedCountry}</span>
        {" - "}Broadcasters shown for:{" "}
        <span className="font-semibold">{countryCode}</span>
      </p>

      <SportTabs active={sport} region={countryCode} />

      <Suspense
        fallback={
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium text-gray-700">
              Broadcasters for:
            </span>
            <span className="border rounded px-3 py-1.5 text-sm bg-white text-gray-400">
              Loading...
            </span>
          </div>
        }
      >
        <RegionSelector current={countryCode} />
      </Suspense>

      {dataError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          <strong>Data temporarily unavailable.</strong> {dataError}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-6">
        Fixtures today: {totalFetched} - Live: {live.length} - Upcoming:{" "}
        {scheduled.length} - Finished: {finished.length}
      </p>

      {live.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Now ({live.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((f) => (
              <EventCard key={f.id} fixture={f} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Upcoming ({scheduled.length})
        </h2>
        {scheduled.length === 0 ? (
          <p className="text-gray-500">
            No upcoming fixtures for this sport today.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scheduled.slice(0, 60).map((f) => (
              <EventCard key={f.id} fixture={f} />
            ))}
          </div>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Results ({finished.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {finished.slice(0, 30).map((f) => (
              <EventCard key={f.id} fixture={f} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}