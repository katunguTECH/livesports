// src/lib/leagues.ts

export type SportKey =
  | "soccer"
  | "basketball"
  | "football"
  | "baseball"
  | "hockey";

export interface LeagueConfig {
  sport: SportKey;
  slug: string;        // ESPN league slug
  leagueId: number;    // numeric ID used in your DB (matches legacy API-Sports IDs for soccer)
  name: string;
}

// Order matters: first entries render first in the UI.
export const LEAGUES: LeagueConfig[] = [
  // ---- Soccer (ESPN sport = "soccer") ----
  // IDs deliberately reuse your existing API-Sports leagueId values,
  // so the 41 broadcaster mappings already in the DB keep working.
  { sport: "soccer", slug: "eng.1",          leagueId: 39,  name: "Premier League" },
  { sport: "soccer", slug: "uefa.champions", leagueId: 2,   name: "UEFA Champions League" },
  { sport: "soccer", slug: "uefa.europa",    leagueId: 3,   name: "UEFA Europa League" },
  { sport: "soccer", slug: "esp.1",          leagueId: 140, name: "La Liga" },
  { sport: "soccer", slug: "ita.1",          leagueId: 135, name: "Serie A" },
  { sport: "soccer", slug: "ger.1",          leagueId: 78,  name: "Bundesliga" },
  { sport: "soccer", slug: "fra.1",          leagueId: 61,  name: "Ligue 1" },
  { sport: "soccer", slug: "ned.1",          leagueId: 88,  name: "Eredivisie" },
  { sport: "soccer", slug: "por.1",          leagueId: 94,  name: "Primeira Liga" },
  { sport: "soccer", slug: "eng.2",          leagueId: 40,  name: "EFL Championship" },
  { sport: "soccer", slug: "usa.1",          leagueId: 253, name: "MLS" },
  { sport: "soccer", slug: "mex.1",          leagueId: 262, name: "Liga MX" },
  { sport: "soccer", slug: "bra.1",          leagueId: 71,  name: "Brasileirao" },

  // ---- Basketball ----
  { sport: "basketball", slug: "nba",  leagueId: 1001, name: "NBA" },
  { sport: "basketball", slug: "wnba", leagueId: 1002, name: "WNBA" },

  // ---- American Football ----
  { sport: "football", slug: "nfl",            leagueId: 1003, name: "NFL" },
  { sport: "football", slug: "college-football", leagueId: 1004, name: "NCAA Football" },

  // ---- Baseball ----
  { sport: "baseball", slug: "mlb", leagueId: 1005, name: "MLB" },

  // ---- Hockey ----
  { sport: "hockey", slug: "nhl", leagueId: 1006, name: "NHL" },

  // ---- Rugby: unverified slug. Enable after testing ----
  // { sport: "rugby" as SportKey, slug: "rugby-union", leagueId: 1007, name: "Rugby Union" },
];

export const SPORT_TABS: { key: SportKey; label: string; icon: string }[] = [
  { key: "soccer",     label: "Football",   icon: "F" },
  { key: "basketball", label: "Basketball", icon: "B" },
  { key: "football",   label: "NFL",        icon: "N" },
  { key: "baseball",   label: "Baseball",   icon: "b" },
  { key: "hockey",     label: "Hockey",     icon: "H" },
];

export function leaguesForSport(sport: SportKey): LeagueConfig[] {
  return LEAGUES.filter((l) => l.sport === sport);
}