// src/lib/api.ts
import { LEAGUES, leaguesForSport, type LeagueConfig, type SportKey } from "./leagues";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

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

/**
 * Read status from the competition first, then the event.
 * Tennis/MMA put the live state on competitions inside groupings,
 * while the event-level status stays "pre" for the whole tournament.
 */
function readStatus(ev: any, comp: any) {
  const statusObj = comp?.status ?? ev?.status ?? {};
  const type = statusObj?.type ?? {};

  const state = type.state;
  const completed = Boolean(type.completed);

  let status: Fixture["status"];
  if (completed || state === "post") status = "finished";
  else if (state === "in") status = "live";
  else status = "scheduled";

  const detail =
    statusObj?.shortDetail ??
    type?.shortDetail ??
    type?.detail ??
    type?.description ??
    statusObj?.displayClock ??
    "";

  return { status, detail, completed };
}

function pickTeam(competitors: any[], side: "home" | "away"): Team {
  const c = competitors.find((x) => x.homeAway === side) ?? {};

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
  const scoreText = typeof rawScore === "string" ? rawScore : undefined;

  let linescoreText: string | undefined;
  if (Array.isArray(c.linescores) && c.linescores.length > 0) {
    const sets = c.linescores
      .map((ls: any) => ls.value ?? ls.displayValue)
      .filter((v: any) => v !== undefined && v !== null);
    if (sets.length > 0) linescoreText = sets.join(" ");
  }

  return {
    id: String(athlete.id ?? team.id ?? c.id ?? ""),
    name,
    shortName,
    logo: athlete.logo ?? team.logo ?? "",
    score: numericScore,
    scoreText,
    linescoreText,
    winner: Boolean(c.winner),
  };
}

async function fetchLeague(cfg: LeagueConfig, date: string): Promise<Fixture[]> {
  const url = `${ESPN_BASE}/${cfg.espnSport}/${cfg.slug}/scoreboard?dates=${date}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 }, // 60s, not 300 â€” live games should appear fast
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.error(`ESPN ${cfg.espnSport}/${cfg.slug} returned ${res.status}`);
    return [];
  }

  const data = await res.json();
  const events: any[] = data.events ?? [];
  const fixtures: Fixture[] = [];

  for (const ev of events) {
    // Tennis nests competitions inside groupings. Standard sports use ev.competitions.
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

      const startTime = comp.date ?? ev.date;
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

function isDisplayable(f: Fixture): boolean {
  if (f.home.name === "Unknown" && f.away.name === "Unknown") return false;
  if (f.home.name === "TBD" && f.away.name === "TBD") return false;
  if (f.status === "scheduled") {
    const age = Date.now() - new Date(f.startTime).getTime();
    if (age > 24 * 60 * 60 * 1000) return false;
  }
  return true;
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
    if (r.status === "fulfilled") fixtures.push(...r.value.filter(isDisplayable));
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
          next: { revalidate: 60 },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) return [];
        const data = await res.json();

        return (data.events ?? []).map((ev: any) => {
          const comp = ev.competitions?.[0] ?? {};
          const competitors = comp.competitors ?? [];
          const { status, detail } = readStatus(ev, comp);

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
            status,
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