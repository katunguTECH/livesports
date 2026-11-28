import {
  LEAGUES,
  leaguesForSport,
  type LeagueConfig,
  type SportKey,
} from "./leagues";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

const DAY_MS = 24 * 60 * 60 * 1000;

// Limit concurrent ESPN requests to 20.
const ESPN_MAX_CONCURRENT_REQUESTS = 20;

// Per-request timeout: if ESPN doesn't answer in 6s, give up.
const ESPN_REQUEST_TIMEOUT_MS = 6000;

// Per-sport budget: even if every request hangs, the sport returns
// partial data after this many ms so the page can render.
const SPORT_TIMEOUT_MS = 15000;

// Some networks / CDNs block Node's default undici User-Agent.
// Pretend to be a normal browser.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Safari/537.36";
// --- Cache: serves stale data instantly and refreshes in the background ---
const g = globalThis as any; const fixturesCache: Map<string, { data: any; fresh: number }> = (g.__fixturesCache ??= new Map());
const inflight: Map<string, Promise<any>> = (g.__fixturesInflight ??= new Map());

function refresh<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  let p = inflight.get(key);
  if (!p) {
    p = fn()
      .then((data) => {
        fixturesCache.set(key, { data, fresh: Date.now() + ttlMs });
        return data;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p as Promise<T>;
}

async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = fixturesCache.get(key);
  if (hit && hit.fresh > Date.now()) return hit.data as T;
  if (hit) {
    refresh(key, ttlMs, fn).catch(console.error);
    return hit.data as T;
  }
  return refresh(key, ttlMs, fn);
}
// --- End cache helper ---


let activeEspnRequests = 0;
const waitingEspnRequests: Array<() => void> = [];

async function acquireEspnRequestSlot(): Promise<void> {
  if (activeEspnRequests < ESPN_MAX_CONCURRENT_REQUESTS) {
    activeEspnRequests += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    waitingEspnRequests.push(resolve);
  });
}

function releaseEspnRequestSlot(): void {
  const nextRequest = waitingEspnRequests.shift();

  if (nextRequest) {
    // Hand the existing slot directly to the next waiting request.
    nextRequest();
  } else {
    activeEspnRequests -= 1;
  }
}

async function withEspnRequest<T>(
  request: () => Promise<T>
): Promise<T> {
  await acquireEspnRequestSlot();

  try {
    return await request();
  } finally {
    releaseEspnRequestSlot();
  }
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  score: number | null;
  scoreText?: string;
  linescoreText?: string;
  winner: boolean;
}

export interface BroadcasterHint {
  name: string;
  market: string;
}

export interface Fixture {
  id: string;
  eventId: string;
  sport: SportKey;
  sportLabel: string;
  leagueId: number;
  leagueName: string;
  leagueSlug: string;
  startTime: string;
  status: "scheduled" | "live" | "finished";
  statusDetail: string;
  home: Team;
  away: Team;
  espnBroadcasts: BroadcasterHint[];
}

export interface GolfPlayer {
  name: string;
  score: string;
  position: string;
  order: number;
}

export interface GolfTournament {
  id: string;
  eventId: string;
  name: string;
  leagueId: number;
  leagueName: string;
  startTime: string;
  status: "scheduled" | "live" | "finished";
  statusDetail: string;
  leaderboard: GolfPlayer[];
}

const SPORT_LABELS: Record<SportKey, string> = {
  soccer: "Football",
  basketball: "Basketball",
  ncaab: "NCAAB",
  football: "NFL",
  baseball: "Baseball",
  hockey: "Hockey",
  tennis: "Tennis",
  mma: "MMA",
  golf: "Golf",
  rugby: "Rugby",
};

/**
 * Get today's date according to the US Eastern timezone.
 * ESPN scoreboard dates are based on the US event calendar.
 */
function todayParam(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}${month}${day}`;
}

/**
 * Return yesterday and today's ESPN date strings.
 * This helps capture games that ESPN places under the
 * previous US Eastern calendar date.
 */
function scoreboardDates(): string[] {
  const today = todayParam();

  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(4, 6));
  const day = Number(today.slice(6, 8));

  const previousDate = new Date(
    Date.UTC(year, month - 1, day) - DAY_MS
  );

  const yesterday = [
    previousDate.getUTCFullYear(),
    String(previousDate.getUTCMonth() + 1).padStart(2, "0"),
    String(previousDate.getUTCDate()).padStart(2, "0"),
  ].join("");

  return [yesterday, today];
}

/**
 * Read status from the competition first, then the event.
 * Tennis and MMA can put live status on competitions
 * while the event-level status remains "pre".
 */
function readStatus(ev: any, comp: any) {
  const statusObj = comp?.status ?? ev?.status ?? {};
  const type = statusObj?.type ?? {};

  const state = type.state;
  const completed = Boolean(type.completed);

  let status: Fixture["status"];

  if (completed || state === "post") {
    status = "finished";
  } else if (state === "in") {
    status = "live";
  } else {
    status = "scheduled";
  }

  const detail =
    statusObj?.shortDetail ??
    type?.shortDetail ??
    type?.detail ??
    type?.description ??
    statusObj?.displayClock ??
    "";

  return { status, detail, completed };
}

function pickTeam(
  competitors: any[],
  side: "home" | "away"
): Team {
  const c =
    competitors.find((x) => x.homeAway === side) ?? {};

  const athlete = c.athlete ?? {};
  const team = c.team ?? {};

  const name =
    c.name ??
    athlete.displayName ??
    athlete.fullName ??
    athlete.shortName ??
    team.displayName ??
    team.name ??
    team.shortName ??
    "Unknown";

  const shortName =
    athlete.shortDisplayName ??
    athlete.abbreviation ??
    athlete.shortName ??
    team.shortDisplayName ??
    team.abbreviation ??
    team.shortName ??
    c.name ??
    "Unknown";

  const rawScore = c.score;

  const numericScore =
    typeof rawScore === "number"
      ? rawScore
      : rawScore !== null &&
          rawScore !== undefined &&
          rawScore !== "" &&
          Number.isFinite(Number(rawScore))
        ? Number(rawScore)
        : null;

  const scoreText =
    typeof rawScore === "string" ? rawScore : undefined;

  let linescoreText: string | undefined;

  if (
    Array.isArray(c.linescores) &&
    c.linescores.length > 0
  ) {
    const sets = c.linescores
      .map((ls: any) => ls.value ?? ls.displayValue)
      .filter(
        (v: any) => v !== undefined && v !== null
      );

    if (sets.length > 0) {
      linescoreText = sets.join(" ");
    }
  }

  return {
    id: String(
      athlete.id ?? team.id ?? c.id ?? ""
    ),
    name,
    shortName,
    logo: athlete.logo ?? team.logo ?? "",
    score: numericScore,
    scoreText,
    linescoreText,
    winner: Boolean(c.winner),
  };
}

/**
 * Fetch one league's scoreboard for an ESPN date or date range.
 */
async function fetchLeague(
  cfg: LeagueConfig,
  dateRange: string
): Promise<Fixture[]> {
  const params = new URLSearchParams({
    dates: dateRange,
    limit: "500",
  });

  // ESPN uses groups to return a broader NCAAB scoreboard.
  if (cfg.slug === "mens-college-basketball") {
    params.set("groups", "50");
  }

  const url =
    `${ESPN_BASE}/${cfg.espnSport}/${cfg.slug}/scoreboard?${params.toString()}`;

  const res = await withEspnRequest(() =>
    fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": BROWSER_UA,
      },
      next: {
        revalidate: 60,
      },
      signal: AbortSignal.timeout(ESPN_REQUEST_TIMEOUT_MS),
    })
  );

  if (!res.ok) {
    console.error(
      `ESPN ${cfg.espnSport}/${cfg.slug} returned ${res.status}`
    );
    return [];
  }

  const data = await res.json();
  const events: any[] = data.events ?? [];
  const fixtures: Fixture[] = [];

  for (const ev of events) {
    // Tennis can nest competitions inside groupings.
    // Standard sports use ev.competitions.
    const competitions: any[] = ev.groupings
      ? ev.groupings.flatMap(
          (g: any) => g.competitions ?? []
        )
      : ev.competitions ?? [];

    for (const comp of competitions) {
      const competitors = comp.competitors ?? [];

      if (competitors.length === 0) {
        continue;
      }

      const compBroadcasts: BroadcasterHint[] = (
        comp.broadcasts ?? []
      ).map((b: any) => ({
        name:
          b.media?.shortName ??
          b.media?.name ??
          "",
        market: b.market?.type ?? "",
      }));

      const startTime = toUtcIso(
        comp.date ?? ev.date
      );

      const { status, detail } = readStatus(ev, comp);

      fixtures.push({
        id: `${cfg.sport}:${cfg.slug}:${ev.id}:${comp.id ?? ""}`,
        eventId: String(ev.id),
        sport: cfg.sport,
        sportLabel: SPORT_LABELS[cfg.sport],
        leagueId: cfg.leagueId,
        leagueName: cfg.name,
        leagueSlug: cfg.slug,
        startTime,
        status,
        statusDetail: detail,
        home: pickTeam(competitors, "home"),
        away: pickTeam(competitors, "away"),
        espnBroadcasts: compBroadcasts,
      });
    }
  }

  return fixtures;
}

/**
 * Fetch a whole sport's scoreboard for one date and map events back to
 * the correct league config. This replaces one-fetch-per-league with
 * one-fetch-per-sport, dramatically reducing the number of requests.
 *
 * Sports that require a league-specific URL (NCAAB with groups=50,
 * tennis which has separate ATP/WTA configs under the same espnSport)
 * fall back to per-league fetching.
 */
/**
 * Sports that must use league-specific ESPN scoreboard URLs.
 *
 * IMPORTANT:
 * ESPN's scoreboard API is not reliably available as a generic
 * sport-level endpoint for these sports. NBA/NFL/MMA/Rugby in
 * particular need the league slug in the URL, e.g.
 *
 *   /basketball/nba/scoreboard
 *   /football/nfl/scoreboard
 *   /mma/ufc/scoreboard
 *   /rugby/<league>/scoreboard
 *
 * fetchSport() therefore falls back to fetchLeague() for every
 * configured league. NCAAB and tennis also require this behavior.
 */
const SPORT_LEVEL_FETCH: Partial<Record<SportKey, boolean>> = {
  // Intentionally empty.
  //
  // Do not set basketball, football, mma, rugby, baseball, or hockey
  // to true here. The league-specific endpoint is more reliable and
  // allows each configured league slug to be requested correctly.
};

async function fetchSport(
  sport: SportKey,
  dateRange: string
): Promise<Fixture[]> {
  const configs = leaguesForSport(sport);
  if (configs.length === 0) return [];

  // Fall back to per-league for sports that need it
  if (!SPORT_LEVEL_FETCH[sport]) {
    const results = await Promise.allSettled(
      configs.map((cfg) => fetchLeague(cfg, dateRange))
    );
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  }

  const espnSport = configs[0].espnSport;
  const params = new URLSearchParams({
    dates: dateRange,
    limit: "500",
  });

  const url = `${ESPN_BASE}/${espnSport}/scoreboard?${params.toString()}`;

  const res = await withEspnRequest(() =>
    fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": BROWSER_UA,
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(ESPN_REQUEST_TIMEOUT_MS),
    })
  );

  if (!res.ok) {
    console.error(`ESPN ${espnSport} (sport-level) returned ${res.status}`);
    return [];
  }

  const data = await res.json();
  const events: any[] = data.events ?? [];
  const fixtures: Fixture[] = [];

  for (const ev of events) {
    // Match this event to the correct league config.
    // ESPN puts league info in ev.league?.slug for sport-level scoreboards.
    const eventLeagueSlug: string =
      ev.league?.slug ??
      ev.competitions?.[0]?.league?.slug ??
      ev.season?.slug ??
      "";

    const cfg =
      configs.find((c) => c.slug === eventLeagueSlug) ??
      configs[0]; // fallback: attribute to first config

    const competitions: any[] = ev.groupings
      ? ev.groupings.flatMap((g: any) => g.competitions ?? [])
      : ev.competitions ?? [];

    for (const comp of competitions) {
      const competitors = comp.competitors ?? [];
      if (competitors.length === 0) continue;

      const compBroadcasts: BroadcasterHint[] = (comp.broadcasts ?? []).map(
        (b: any) => ({
          name: b.media?.shortName ?? b.media?.name ?? "",
          market: b.market?.type ?? "",
        })
      );

      const startTime = toUtcIso(comp.date ?? ev.date);
      const { status, detail } = readStatus(ev, comp);

      fixtures.push({
        id: `${cfg.sport}:${cfg.slug}:${ev.id}:${comp.id ?? ""}`,
        eventId: String(ev.id),
        sport: cfg.sport,
        sportLabel: SPORT_LABELS[cfg.sport],
        leagueId: cfg.leagueId,
        leagueName: cfg.name,
        leagueSlug: cfg.slug,
        startTime,
        status,
        statusDetail: detail,
        home: pickTeam(competitors, "home"),
        away: pickTeam(competitors, "away"),
        espnBroadcasts: compBroadcasts,
      });
    }
  }

  return fixtures;
}

/**
 * Filter out fixtures that should not appear on the directory.
 */
function isDisplayable(f: Fixture): boolean {
  const now = Date.now();
  const startMs = new Date(f.startTime).getTime();
  const ageMs = now - startMs;
  const futureMs = startMs - now;

  const bothJunk =
    (f.home.name === "Unknown" &&
      f.away.name === "Unknown") ||
    (f.home.name === "TBD" &&
      f.away.name === "TBD");

  const anyJunk =
    f.home.name === "Unknown" ||
    f.away.name === "Unknown" ||
    f.home.name === "TBD" ||
    f.away.name === "TBD";

  if (bothJunk) {
    return false;
  }

  if (f.status === "scheduled") {
    // Remove scheduled fixtures more than 24 hours old.
    if (ageMs > DAY_MS) {
      return false;
    }

    // Avoid showing distant fixtures with unknown teams.
    if (futureMs > DAY_MS && anyJunk) {
      return false;
    }
  }

  return true;
}

/**
 * Sort live fixtures first, upcoming fixtures second,
 * and completed fixtures last.
 */
function sortFixtures(fixtures: Fixture[]): Fixture[] {
  const rank = {
    live: 0,
    scheduled: 1,
    finished: 2,
  } as const;

  return fixtures.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) {
      return rank[a.status] - rank[b.status];
    }

    return (
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime()
    );
  });
}

/**
 * Fetch fixtures for a sport across yesterday and today.
 * Separate single-day ESPN requests are made for yesterday and today.
 * Duplicate fixtures are removed using their unique IDs.
 *
 * Each sport is fetched through its configured league-specific ESPN
 * endpoint. This is important for NBA/NFL/MMA/Rugby because the
 * generic sport-level scoreboard endpoint does not provide the same
 * league data reliably.
 *
 * The whole sport fetch is capped at SPORT_TIMEOUT_MS so a slow
 * ESPN response for one league can't block the homepage forever.
 */
export async function getFixturesForSport(
  sport: SportKey
): Promise<Fixture[]> {
  if (sport === "golf") {
    return [];
  }

  return withCache(`fixtures:${sport}`, 60_000, async () => {
    const configs = leaguesForSport(sport);

    if (configs.length === 0) {
      return [];
    }

    const dates = scoreboardDates();

    // Keep results from each date as soon as that date finishes.
    const partialFixtures: Fixture[] = [];

    const fetchPromise: Promise<Fixture[]> = Promise.allSettled(
      dates.map(async (date) => {
        const dateFixtures = await fetchSport(sport, date);
        partialFixtures.push(...dateFixtures.filter(isDisplayable));
      })
    ).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          console.error(`Date fetch rejected for ${sport}:`, result.reason);
        }
      }

      return partialFixtures;
    });

    // If the sport exceeds its time budget, return dates that have completed.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise: Promise<Fixture[]> = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn(
          `Sport ${sport} exceeded ${SPORT_TIMEOUT_MS}ms - returning partial results`
        );
        resolve([...partialFixtures]);
      }, SPORT_TIMEOUT_MS);
    });

    const fixtures = await Promise.race([fetchPromise, timeoutPromise]);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // Remove duplicate events returned by multiple date requests.
    const uniqueFixtures = [
      ...new Map(
        fixtures.map((fixture) => [fixture.id, fixture])
      ).values(),
    ];

    return sortFixtures(uniqueFixtures);
  });
}

/**
 * Fetch fixtures across all configured sports.
 * Golf tournaments are fetched separately.
 */
export async function getAllFixtures(): Promise<Fixture[]> {
  const sports = [
    ...new Set(LEAGUES.map((league) => league.sport)),
  ].filter((sport) => sport !== "golf");

  const results = await Promise.allSettled(
    sports.map((sport) => getFixturesForSport(sport))
  );

  const fixtures: Fixture[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      fixtures.push(...result.value);
    } else {
      console.error(
        "Sport fetch rejected:",
        result.reason
      );
    }
  }

  const uniqueFixtures = [
    ...new Map(
      fixtures.map((fixture) => [
        fixture.id,
        fixture,
      ])
    ).values(),
  ];

  return sortFixtures(uniqueFixtures);
}

/**
 * Fetch golf tournaments and their current leaderboards.
 */
export async function getGolfTournaments(): Promise<
  GolfTournament[]
> {
  return withCache("golf:today", 60_000, async () => {
    const configs = leaguesForSport("golf");
    const date = todayParam();

  const results = await Promise.allSettled(
    configs.map(
      async (cfg): Promise<GolfTournament[]> => {
        const params = new URLSearchParams({
          dates: date,
          limit: "500",
        });

        const url =
          `${ESPN_BASE}/${cfg.espnSport}/${cfg.slug}/scoreboard?${params.toString()}`;

        try {
          const res = await withEspnRequest(() =>
            fetch(url, {
              headers: {
                Accept: "application/json",
                "User-Agent": BROWSER_UA,
              },
              next: {
                revalidate: 60,
              },
              signal: AbortSignal.timeout(ESPN_REQUEST_TIMEOUT_MS),
            })
          );

          if (!res.ok) {
            return [];
          }

          const data = await res.json();

          return (data.events ?? []).map(
            (ev: any) => {
              const comp =
                ev.competitions?.[0] ?? {};

              const competitors =
                comp.competitors ?? [];

              const { status, detail } =
                readStatus(ev, comp);

              const leaderboard: GolfPlayer[] =
                competitors
                  .map((c: any) => {
                    const a =
                      c.athlete ?? c.team ?? {};

                    return {
                      name:
                        a.displayName ??
                        a.fullName ??
                        a.name ??
                        "Unknown",
                      score: String(
                        c.score ?? "-"
                      ),
                      position: String(
                        c.order ??
                          c.status?.position
                            ?.displayName ??
                          "-"
                      ),
                      order: Number(
                        c.order ?? 999
                      ),
                    };
                  })
                  .sort(
                    (x: GolfPlayer, y: GolfPlayer) =>
                      x.order - y.order
                  )
                  .slice(0, 5);

              return {
                id: `golf:${cfg.slug}:${ev.id}`,
                eventId: String(ev.id),
                name: ev.name ?? cfg.name,
                leagueId: cfg.leagueId,
                leagueName: cfg.name,
                startTime: toUtcIso(ev.date),
                status,
                statusDetail: detail,
                leaderboard,
              } as GolfTournament;
            }
          );
        } catch (error) {
          console.error(
            `Golf fetch failed for ${cfg.slug}:`,
            error
          );
          return [];
        }
      }
    )
  );

  const all: GolfTournament[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    } else {
      console.error(
        "Golf fetch rejected:",
        r.reason
      );
    }
  }

    return [
      ...new Map(
        all.map((tournament) => [
          tournament.id,
          tournament,
        ])
      ).values(),
    ];
  });
}

export { LEAGUES };

/**
 * Normalize ESPN dates to ISO UTC strings.
 */
function toUtcIso(s: string): string {
  if (!s) {
    return s;
  }

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    return s;
  }

  return (
    (s.includes("T") ? s : s.replace(" ", "T")) +
    "Z"
  );
}
