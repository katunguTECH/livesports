// src/app/page.tsx
import { headers } from "next/headers";
import { Suspense } from "react";
import { getFixturesForSport, getGolfTournaments } from "@/lib/api";
import { getBroadcastersForFixture } from "@/lib/broadcaster-matcher";
import EventCard from "@/components/EventCard";
import TournamentCard from "@/components/TournamentCard";
import RegionSelector from "@/components/RegionSelector";
import SportTabs from "@/components/SportTabs";
import type { SportKey } from "@/lib/leagues";

export const revalidate = 60;

const VALID_SPORTS: SportKey[] = [
  "soccer",
  "basketball",
  "football",
  "baseball",
  "hockey",
  "tennis",
  "mma",
  "golf",
  "rugby",
];

type FixtureWithBroadcasters = Awaited<
  ReturnType<typeof getFixturesForSport>
>[number] & {
  broadcasters: Awaited<ReturnType<typeof getBroadcastersForFixture>>;
};

type GolfWithBroadcasters = Awaited<
  ReturnType<typeof getGolfTournaments>
>[number] & {
  broadcasters: Awaited<ReturnType<typeof getBroadcastersForFixture>>;
};

function Hero({
  detectedCountry,
  showingCountry,
}: {
  detectedCountry: string;
  showingCountry: string;
}) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Live directory
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground-subtle">
          9 sports
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground-subtle">
          Worldwide broadcasters
        </span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Watch any sport,{" "}
        <span className="text-foreground-subtle">anywhere.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground-muted">
        Live fixtures across 9 sports, with every legal broadcaster for your
        region and global options for travelers. No sign-up, no geolocation
        locks.
      </p>
      <p className="mt-3 text-[11px] font-medium text-foreground-subtle">
        Detected: <span className="text-foreground-muted">{detectedCountry}</span> &middot; Showing broadcasters for: <span className="text-foreground-muted">{showingCountry}</span>
      </p>
    </section>
  );
}

function SectionHeader({
  title,
  count,
  live,
}: {
  title: string;
  count: number;
  live?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
        {live && (
          <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-0.5 animate-pulse rounded-full bg-live" />
        )}
        {title}
      </h2>
      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-foreground-muted">
        {count}
      </span>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-foreground-subtle"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-foreground-muted">
        {description}
      </p>
    </div>
  );
}

function StatLine({ label, count }: { label: string; count: number }) {
  return (
    <span className="text-[11px] font-medium text-foreground-subtle">
      {count} {label}
    </span>
  );
}

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

  let dataError: string | null = null;

  if (sport === "golf") {
    let tournaments: GolfWithBroadcasters[] = [];
    let total = 0;
    try {
      const list = await getGolfTournaments();
      total = list.length;
      tournaments = await Promise.all(
        list.map(async (t) => {
          try {
            const broadcasters = await getBroadcastersForFixture(
              { id: t.id, sport: "golf", leagueId: t.leagueId } as any,
              countryCode
            );
            return { ...t, broadcasters };
          } catch {
            return { ...t, broadcasters: [] };
          }
        })
      );
    } catch (err) {
      dataError = err instanceof Error ? err.message : "Unknown error";
    }

    const live = tournaments.filter((t) => t.status === "live");
    const scheduled = tournaments.filter((t) => t.status === "scheduled");
    const finished = tournaments.filter((t) => t.status === "finished");

    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Hero detectedCountry={detectedCountry} showingCountry={countryCode} />

        <SportTabs active={sport} region={countryCode} />

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
          <Suspense
            fallback={
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
                Broadcasters for
              </span>
            }
          >
            <RegionSelector current={countryCode} />
          </Suspense>
          <StatLine label="tournaments today" count={total} />
        </div>

        {dataError && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong className="font-semibold">Data temporarily unavailable.</strong>{" "}
            {dataError}
          </div>
        )}

        {live.length > 0 && (
          <section className="mb-10">
            <SectionHeader title="Live now" count={live.length} live />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <SectionHeader title="Upcoming" count={scheduled.length} />
          {scheduled.length === 0 ? (
            <EmptyState
              title="No upcoming tournaments today"
              description="Check back tomorrow, or browse another sport above."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scheduled.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          )}
        </section>

        {finished.length > 0 && (
          <section>
            <SectionHeader title="Results" count={finished.length} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {finished.slice(0, 30).map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }

  let fixturesWithBroadcasters: FixtureWithBroadcasters[] = [];
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

  const hasLive = live.length > 0;
  const hasUpcoming = scheduled.length > 0;
  const hasFinished = finished.length > 0;
  const hasNothing = !hasLive && !hasUpcoming && !hasFinished;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Hero detectedCountry={detectedCountry} showingCountry={countryCode} />

      <SportTabs active={sport} region={countryCode} />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        <Suspense
          fallback={
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Broadcasters for
            </span>
          }
        >
          <RegionSelector current={countryCode} />
        </Suspense>
        <StatLine label="fixtures today" count={totalFetched} />
      </div>

      {dataError && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong className="font-semibold">Data temporarily unavailable.</strong>{" "}
          {dataError}
        </div>
      )}

      {hasNothing ? (
        <EmptyState
          title="Nothing scheduled for this sport today"
          description="Pick another sport above, or check back tomorrow."
        />
      ) : (
        <>
          {hasLive && (
            <section className="mb-10">
              <SectionHeader title="Live now" count={live.length} live />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {live.slice(0, 30).map((f) => (
                  <EventCard key={f.id} fixture={f} />
                ))}
              </div>
            </section>
          )}

          {hasUpcoming && (
            <section className="mb-10">
              <SectionHeader title="Upcoming" count={scheduled.length} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scheduled.slice(0, 60).map((f) => (
                  <EventCard key={f.id} fixture={f} />
                ))}
              </div>
            </section>
          )}

          {!hasLive && !hasUpcoming && hasFinished && (
            <div className="mb-6 rounded-lg border border-border bg-surface px-4 py-3 text-[13px] text-foreground-muted">
              All matches for today have finished. Showing recent results
              below.
            </div>
          )}

          {hasFinished && (
            <section>
              <SectionHeader title="Results" count={finished.length} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {finished.slice(0, 30).map((f) => (
                  <EventCard key={f.id} fixture={f} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}