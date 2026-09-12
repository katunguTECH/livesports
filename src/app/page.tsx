// src/app/page.tsx
import { headers } from "next/headers";
import { getLiveAndUpcomingFixtures } from "@/lib/api";
import { getBroadcasterForFixture } from "@/lib/broadcaster-matcher";
import EventCard from "@/components/EventCard";
import type { Fixture } from "@/lib/api";
import type { Broadcaster } from "@/generated/prisma/client";

export const revalidate = 60;

type FixtureWithBroadcaster = Fixture & { broadcaster: Broadcaster | null };

export default async function HomePage() {
  const headersList = await headers();
  const countryCode = headersList.get("x-vercel-ip-country") ?? "KE";

  let fixtures: Fixture[] = [];
  let fixturesWithBroadcasters: FixtureWithBroadcaster[] = [];
  let dataError: string | null = null;

  try {
    fixtures = await getLiveAndUpcomingFixtures();

    fixturesWithBroadcasters = await Promise.all(
      fixtures.map(async (fixture) => {
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

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Live &amp; Upcoming Sport</h1>
      <p className="text-sm text-gray-500 mb-6">
        Showing broadcasters available in:{" "}
        <span className="font-semibold">{countryCode}</span>
      </p>

      {dataError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          <strong>Data temporarily unavailable.</strong> {dataError}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-8">
        Total fixtures today: {fixtures.length} &middot; Live: {live.length}{" "}
        &middot; Upcoming: {upcoming.length}
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
          <p className="text-gray-500">No upcoming fixtures today.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((f) => (
              <EventCard key={f.fixture.id} fixture={f} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}