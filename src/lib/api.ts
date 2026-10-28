// src/lib/api.ts
import { LEAGUES, leaguesForSport, type LeagueConfig, type SportKey } from "./leagues";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  score: number | null;
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

const SPORT_LABELS: Record<SportKey, string> = {
  soccer: "Football",
  basketball: "Basketball",
  football: "NFL",
  baseball: "Baseball",
  hockey: "Hockey",
};

function todayParam(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function mapStatus(state: string): Fixture["status"] {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "scheduled";
}

function pickTeam(competitors: any[], side: "home" | "away"): Team {
  const c = competitors.find((x) => x.homeAway === side) ?? {};
  const t = c.team ?? {};
  const scoreNum =
    c.score === undefined || c.score === null || c.score === ""
      ? null
      : Number(c.score);

  return {
    id: String(t.id ?? ""),
    name: t.displayName ?? t.name ?? "TBD",
    shortName: t.shortDisplayName ?? t.abbreviation ?? t.name ?? "TBD",
    logo: t.logo ?? "",
    score: Number.isFinite(scoreNum as number) ? (scoreNum as number) : null,
    winner: Boolean(c.winner),
  };
}

async function fetchLeague(
  cfg: LeagueConfig,
  date: string
): Promise<Fixture[]> {
  const url = `${ESPN_BASE}/${cfg.sport}/${cfg.slug}/scoreboard?dates=${date}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.error(`ESPN ${cfg.sport}/${cfg.slug} returned ${res.status}`);
    return [];
  }

  const data = await res.json();
  const events: any[] = data.events ?? [];

  return events.map((ev) => {
    const comp = ev.competitions?.[0] ?? {};
    const competitors = comp.competitors ?? [];
    const statusType = ev.status?.type ?? {};
    const detail =
      statusType.shortDetail ??
      statusType.detail ??
      ev.status?.displayClock ??
      statusType.description ??
      "";

    const broadcasts: BroadcasterHint[] = (comp.broadcasts ?? []).map(
      (b: any) => ({
        name: b.media?.shortName ?? b.media?.name ?? "",
        market: b.market?.type ?? "",
      })
    );

    return {
      id: `${cfg.sport}:${cfg.slug}:${ev.id}`,
      eventId: String(ev.id),
      sport: cfg.sport,
      sportLabel: SPORT_LABELS[cfg.sport],
      leagueId: cfg.leagueId,
      leagueName: cfg.name,
      leagueSlug: cfg.slug,
      startTime: ev.date,
      status: mapStatus(statusType.state),
      statusDetail: detail,
      home: pickTeam(competitors, "home"),
      away: pickTeam(competitors, "away"),
      espnBroadcasts: broadcasts,
    } as Fixture;
  });
}

export async function getFixturesForSport(sport: SportKey): Promise<Fixture[]> {
  const configs = leaguesForSport(sport);
  if (configs.length === 0) return [];

  const date = todayParam();

  const results = await Promise.allSettled(
    configs.map((cfg) => fetchLeague(cfg, date))
  );

  const fixtures: Fixture[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") fixtures.push(...r.value);
    else console.error("League fetch rejected:", r.reason);
  }

  const rank = { live: 0, scheduled: 1, finished: 2 } as const;
  fixtures.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return fixtures;
}

export { LEAGUES };