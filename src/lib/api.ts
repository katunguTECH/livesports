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
  football: "NFL",
  baseball: "Baseball",
  hockey: "Hockey",
  tennis: "Tennis",
  mma: "MMA",
  golf: "Golf",
  rugby: "Rugby",
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
  const entity = c.team ?? c.athlete ?? c.player ?? {};
  const scoreNum =
    c.score === undefined || c.score === null || c.score === ""
      ? null
      : Number(c.score);

  return {
    id: String(entity.id ?? ""),
    name: entity.displayName ?? entity.fullName ?? entity.name ?? "TBD",
    shortName:
      entity.shortDisplayName ??
      entity.abbreviation ??
      entity.shortName ??
      entity.name ??
      "TBD",
    logo: entity.logo ?? "",
    score: Number.isFinite(scoreNum as number) ? (scoreNum as number) : null,
    winner: Boolean(c.winner),
  };
}

async function fetchLeague(cfg: LeagueConfig, date: string): Promise<Fixture[]> {
  const url = `${ESPN_BASE}/${cfg.espnSport}/${cfg.slug}/scoreboard?dates=${date}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.error(`ESPN ${cfg.espnSport}/${cfg.slug} returned ${res.status}`);
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
  if (sport === "golf") return [];
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

export async function getGolfTournaments(): Promise<GolfTournament[]> {
  const configs = leaguesForSport("golf");
  const date = todayParam();

  const results = await Promise.allSettled(
    configs.map(async (cfg): Promise<GolfTournament[]> => {
      const url = `${ESPN_BASE}/${cfg.espnSport}/${cfg.slug}/scoreboard?dates=${date}`;
      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          next: { revalidate: 300 },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.events ?? []).map((ev: any) => {
          const comp = ev.competitions?.[0] ?? {};
          const competitors = comp.competitors ?? [];
          const statusType = ev.status?.type ?? {};
          const detail =
            statusType.shortDetail ??
            statusType.detail ??
            statusType.description ??
            "";

          const leaderboard: GolfPlayer[] = competitors
            .map((c: any) => {
              const a = c.athlete ?? c.team ?? {};
              return {
                name: a.displayName ?? a.fullName ?? a.name ?? "Unknown",
                score: String(c.score ?? "-"),
                position: String(c.order ?? c.status?.position?.displayName ?? "-"),
                order: Number(c.order ?? 999),
              };
            })
            .sort((x: GolfPlayer, y: GolfPlayer) => x.order - y.order)
            .slice(0, 5);

          return {
            id: `golf:${cfg.slug}:${ev.id}`,
            eventId: String(ev.id),
            name: ev.name ?? cfg.name,
            leagueId: cfg.leagueId,
            leagueName: cfg.name,
            startTime: ev.date,
            status: mapStatus(statusType.state),
            statusDetail: detail,
            leaderboard,
          } as GolfTournament;
        });
      } catch {
        return [];
      }
    })
  );

  const all: GolfTournament[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return all;
}

export { LEAGUES };