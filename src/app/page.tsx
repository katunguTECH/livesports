
import { headers } from "next/headers";
import { Suspense } from "react";
import { getPrisma } from "@/lib/prisma";
import {
  getAllFixtures,
  getFixturesForSport,
  getGolfTournaments,
} from "@/lib/api";
import {
  getBroadcastersForFixtures,
  type MatchedBroadcaster,
} from "@/lib/broadcaster-matcher";
import EventCard from "@/components/EventCard";
import TournamentCard from "@/components/TournamentCard";
import RegionSelector from "@/components/RegionSelector";
import SportTabs from "@/components/SportTabs";
import type { SportKey, SportTabKey } from "@/lib/leagues";

export const revalidate = 60;

const VALID_SPORTS: SportKey[] = [
  "soccer",
  "basketball",
  "ncaab",
  "football",
  "baseball",
  "hockey",
  "tennis",
  "mma",
  "golf",
  "rugby",
];

type CommunityLinkForCard = {
  id: number;
  fixtureId: string;
  title: string | null;
  url: string;
  status: string;
  createdAt: string;
};

type FixtureWithBroadcasters = Awaited<
  ReturnType<typeof getFixturesForSport>
>[number] & {
  broadcasters: MatchedBroadcaster[];
};

type GolfWithBroadcasters = Awaited<
  ReturnType<typeof getGolfTournaments>
>[number] & {
  broadcasters: MatchedBroadcaster[];
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
          10 categories
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
        Browse live fixtures across our sports categories, with legal
        broadcaster information for your region. No sign-up required.
      </p>

      <p className="mt-3 text-[11px] font-medium text-foreground-subtle">
        Detected:{" "}
        <span className="text-foreground-muted">
          {detectedCountry}
        </span>{" "}
        &middot; Showing broadcasters for:{" "}
        <span className="text-foreground-muted">
          {showingCountry}
        </span>
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
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="text-sm font-semibold text-foreground">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-sm text-xs text-foreground-muted">
        {description}
      </p>
    </div>
  );
}

function StatLine({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <span className="text-[11px] font-medium text-foreground-subtle">
      {count} {label}
    </span>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    region?: string;
    sport?: string;
  }>;
}) {
  const params = await searchParams;
  const headersList = await headers();

  let detectedCountry =
    headersList.get("x-nf-request-country") ||
    headersList.get("cf-ipcountry") ||
    headersList.get("x-vercel-ip-country");

  detectedCountry = detectedCountry || "US";

  const countryCode = (
    params.region ?? detectedCountry
  ).toUpperCase();

  const requestedSport = params.sport;

  const sport: SportTabKey =
    requestedSport === "all"
      ? "all"
      : VALID_SPORTS.includes(requestedSport as SportKey)
        ? (requestedSport as SportKey)
        : "all";

  let dataError: string | null = null;

  let fixturesWithBroadcasters: FixtureWithBroadcasters[] = [];
  let tournaments: GolfWithBroadcasters[] = [];

  let totalFetched = 0;

  try {
    const [fixtures, golfList] = await Promise.all([
      sport === "golf"
        ? Promise.resolve([])
        : sport === "all"
          ? getAllFixtures()
          : getFixturesForSport(sport),

      sport === "all" || sport === "golf"
        ? getGolfTournaments()
        : Promise.resolve([]),
    ]);

    totalFetched = fixtures.length;

    const broadcastersByFixture =
      await getBroadcastersForFixtures(
        fixtures,
        countryCode
      );

    fixturesWithBroadcasters = fixtures.map((fx) => ({
      ...fx,
      broadcasters:
        broadcastersByFixture.get(fx.id) ?? [],
    }));

    if (golfList.length > 0) {
      const golfFixtures = golfList.map((t) => ({
        id: t.id,
        sport: "golf" as const,
        leagueId: t.leagueId,
        espnBroadcasts: [],
      })) as any;

      const broadcastersByTournament =
        await getBroadcastersForFixtures(
          golfFixtures,
          countryCode
        );

      tournaments = golfList.map((t) => ({
        ...t,
        broadcasters:
          broadcastersByTournament.get(t.id) ?? [],
      }));
    }
  } catch (err) {
    dataError =
      err instanceof Error
        ? err.message
        : "Unknown error";

    console.error("Fixture fetch failed:", err);
  }

  const live = fixturesWithBroadcasters.filter(
    (f) => f.status === "live"
  );

  const scheduled = fixturesWithBroadcasters.filter(
    (f) => f.status === "scheduled"
  );

  const finished = fixturesWithBroadcasters.filter(
    (f) => f.status === "finished"
  );

  const golfLive = tournaments.filter(
    (t) => t.status === "live"
  );

  const golfScheduled = tournaments.filter(
    (t) => t.status === "scheduled"
  );

  const golfFinished = tournaments.filter(
    (t) => t.status === "finished"
  );

  const hasLive = live.length > 0 || golfLive.length > 0;

  const hasUpcoming =
    scheduled.length > 0 || golfScheduled.length > 0;

  const hasFinished =
    finished.length > 0 || golfFinished.length > 0;

  const hasNothing =
    !hasLive && !hasUpcoming && !hasFinished;

  const isGolfOnly = sport === "golf";

  const totalDisplayed =
    totalFetched + tournaments.length;

  // Load community links for all displayed fixtures in one query.
  const displayedFixtures = [
    ...live.slice(0, 30),
    ...scheduled.slice(0, 60),
    ...finished.slice(0, 30),
  ];

  const displayedFixtureIds = [
    ...new Set(displayedFixtures.map((fixture) => fixture.id)),
  ];

  const communityLinksByFixture = new Map<
    string,
    CommunityLinkForCard[]
  >();

  try {
    if (displayedFixtureIds.length > 0) {
      const links = await getPrisma().communityLink.findMany({
        where: {
          fixtureId: {
            in: displayedFixtureIds,
          },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          fixtureId: true,
          title: true,
          url: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      for (const link of links) {
        const cardLink: CommunityLinkForCard = {
          ...link,
          createdAt: link.createdAt.toISOString(),
        };

        const existing =
          communityLinksByFixture.get(link.fixtureId) ?? [];

        existing.push(cardLink);
        communityLinksByFixture.set(link.fixtureId, existing);
      }
    }
  } catch (error) {
    console.error("Bulk community links retrieval failed:", error);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Hero
        detectedCountry={detectedCountry}
        showingCountry={countryCode}
      />

      <SportTabs
        active={sport}
        region={countryCode}
      />

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

        <StatLine
          label={
            isGolfOnly
              ? "tournaments today"
              : sport === "all"
                ? "events and tournaments"
                : "fixtures today"
          }
          count={isGolfOnly ? tournaments.length : totalDisplayed}
        />
      </div>

      {dataError && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong className="font-semibold">
            Data temporarily unavailable.
          </strong>{" "}
          {dataError}
        </div>
      )}

      {hasNothing ? (
        <EmptyState
          title={
            sport === "all"
              ? "No events scheduled today"
              : "Nothing scheduled for this sport today"
          }
          description="Check another category or come back later for updated fixtures."
        />
      ) : (
        <>
          {hasLive && (
            <section className="mb-10">
              <SectionHeader
                title="Live now"
                count={live.length + golfLive.length}
                live
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {live.slice(0, 30).map((f) => (
                  <EventCard
                    key={f.id}
                    fixture={f}
                    communityLinks={
                      communityLinksByFixture.get(f.id) ?? []
                    }
                  />
                ))}

                {golfLive.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                  />
                ))}
              </div>
            </section>
          )}

          {hasUpcoming && (
            <section className="mb-10">
              <SectionHeader
                title="Upcoming"
                count={scheduled.length + golfScheduled.length}
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scheduled.slice(0, 60).map((f) => (
                  <EventCard
                    key={f.id}
                    fixture={f}
                    communityLinks={
                      communityLinksByFixture.get(f.id) ?? []
                    }
                  />
                ))}

                {golfScheduled.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                  />
                ))}
              </div>
            </section>
          )}

          {!hasLive && !hasUpcoming && hasFinished && (
            <div className="mb-6 rounded-lg border border-border bg-surface px-4 py-3 text-[13px] text-foreground-muted">
              All matches for today have finished. Showing recent results below.
            </div>
          )}

          {hasFinished && (
            <section>
              <SectionHeader
                title="Results"
                count={finished.length + golfFinished.length}
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {finished.slice(0, 30).map((f) => (
                  <EventCard
                    key={f.id}
                    fixture={f}
                    communityLinks={
                      communityLinksByFixture.get(f.id) ?? []
                    }
                  />
                ))}

                {golfFinished.slice(0, 30).map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
