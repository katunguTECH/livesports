// src/app/page.tsx
import { headers } from "next/headers";
import { getLiveAndUpcomingFixtures } from "@/lib/api";
import { getBroadcasterForFixture } from "@/lib/broadcaster-matcher";
import EventCard from "@/components/EventCard";

export const revalidate = 60;

export default async function HomePage() {
  const headersList = await headers();
  const countryCode = headersList.get("x-vercel-ip-country") ?? "KE";

  const fixtures = await getLiveAndUpcomingFixtures();

  const fixturesWithBroadcasters = await Promise.all(
    fixtures.map(async (fixture) => {
      const broadcaster = await getBroadcasterForFixture(fixture, countryCode);
      return { ...fixture, broadcaster };
    })
  );

  const live = fixturesWithBroadcasters.filter((f) =>
    ["1H", "2H", "HT", "ET", "LIVE"].includes(f.fixture.status.short)
  );
  const upcoming = fixturesWithBroadcasters.filter((f) => f.fixture.status.short === "NS");

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Live &amp; Upcoming Sport</h1>
      <p className="text-sm text-gray-500 mb-6">
        Showing broadcasters available in: <span className="font-semibold">{countryCode}</span>
      </p>

      <p className="text-xs text-gray-400 mb-8">
        Total fixtures today: {fixtures.length} &middot; Live: {live.length} &middot; Upcoming: {upcoming.length}
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
        <h2 className="text-xl font-semibold mb-4">Upcoming ({upcoming.length})</h2>
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