// src/lib/leagues.ts

export type SportKey =
  | "soccer"
  | "basketball"
  | "football"
  | "baseball"
  | "hockey"
  | "tennis"
  | "mma"
  | "golf"
  | "rugby";

export interface LeagueConfig {
  sport: SportKey;
  espnSport: string;   // ESPN path segment (e.g. "rugby" vs "rugby-league")
  slug: string;
  leagueId: number;
  name: string;
}

export const LEAGUES: LeagueConfig[] = [
  // ---- Soccer ----
  { sport: "soccer", espnSport: "soccer", slug: "eng.1",          leagueId: 39,  name: "Premier League" },
  { sport: "soccer", espnSport: "soccer", slug: "uefa.champions", leagueId: 2,   name: "UEFA Champions League" },
  { sport: "soccer", espnSport: "soccer", slug: "uefa.europa",    leagueId: 3,   name: "UEFA Europa League" },
  { sport: "soccer", espnSport: "soccer", slug: "esp.1",          leagueId: 140, name: "La Liga" },
  { sport: "soccer", espnSport: "soccer", slug: "ita.1",          leagueId: 135, name: "Serie A" },
  { sport: "soccer", espnSport: "soccer", slug: "ger.1",          leagueId: 78,  name: "Bundesliga" },
  { sport: "soccer", espnSport: "soccer", slug: "fra.1",          leagueId: 61,  name: "Ligue 1" },
  { sport: "soccer", espnSport: "soccer", slug: "ned.1",          leagueId: 88,  name: "Eredivisie" },
  { sport: "soccer", espnSport: "soccer", slug: "por.1",          leagueId: 94,  name: "Primeira Liga" },
  { sport: "soccer", espnSport: "soccer", slug: "eng.2",          leagueId: 40,  name: "EFL Championship" },
  { sport: "soccer", espnSport: "soccer", slug: "usa.1",          leagueId: 253, name: "MLS" },
  { sport: "soccer", espnSport: "soccer", slug: "mex.1",          leagueId: 262, name: "Liga MX" },
  { sport: "soccer", espnSport: "soccer", slug: "bra.1",          leagueId: 71,  name: "Brasileirao" },

  // ---- Basketball ----
  { sport: "basketball", espnSport: "basketball", slug: "nba",  leagueId: 1001, name: "NBA" },
  { sport: "basketball", espnSport: "basketball", slug: "wnba", leagueId: 1002, name: "WNBA" },

  // ---- American Football ----
  { sport: "football", espnSport: "football", slug: "nfl",              leagueId: 1003, name: "NFL" },
  { sport: "football", espnSport: "football", slug: "college-football", leagueId: 1004, name: "NCAA Football" },

  // ---- Baseball ----
  { sport: "baseball", espnSport: "baseball", slug: "mlb", leagueId: 1005, name: "MLB" },

  // ---- Hockey ----
  { sport: "hockey", espnSport: "hockey", slug: "nhl", leagueId: 1006, name: "NHL" },

  // ---- Tennis ----
  { sport: "tennis", espnSport: "tennis", slug: "atp", leagueId: 2001, name: "ATP Tour" },
  { sport: "tennis", espnSport: "tennis", slug: "wta", leagueId: 2002, name: "WTA Tour" },

  // ---- MMA ----
  { sport: "mma", espnSport: "mma", slug: "ufc", leagueId: 2003, name: "UFC" },

  // ---- Golf ----
  { sport: "golf", espnSport: "golf", slug: "pga", leagueId: 2004, name: "PGA Tour" },
  { sport: "golf", espnSport: "golf", slug: "lpga", leagueId: 2005, name: "LPGA" },
  { sport: "golf", espnSport: "golf", slug: "eur", leagueId: 2006, name: "DP World Tour" },
  { sport: "golf", espnSport: "golf", slug: "liv", leagueId: 2007, name: "LIV Golf" },

  // ---- Rugby Union (numeric ESPN league IDs) ----
  { sport: "rugby", espnSport: "rugby", slug: "180659", leagueId: 2101, name: "Six Nations" },
  { sport: "rugby", espnSport: "rugby", slug: "244293", leagueId: 2102, name: "Rugby Championship" },
  { sport: "rugby", espnSport: "rugby", slug: "164205", leagueId: 2103, name: "Rugby World Cup" },
  { sport: "rugby", espnSport: "rugby", slug: "242041", leagueId: 2104, name: "Super Rugby Pacific" },
  { sport: "rugby", espnSport: "rugby", slug: "271937", leagueId: 2105, name: "Champions Cup" },
  { sport: "rugby", espnSport: "rugby", slug: "267979", leagueId: 2106, name: "Gallagher Premiership" },
  { sport: "rugby", espnSport: "rugby", slug: "270557", leagueId: 2107, name: "United Rugby Championship" },
  { sport: "rugby", espnSport: "rugby", slug: "270559", leagueId: 2108, name: "Top 14" },
  { sport: "rugby", espnSport: "rugby", slug: "289262", leagueId: 2109, name: "Major League Rugby" },
  { sport: "rugby", espnSport: "rugby", slug: "289234", leagueId: 2110, name: "International Test" },

  // ---- Rugby League (different ESPN sport path) ----
  { sport: "rugby", espnSport: "rugby-league", slug: "3", leagueId: 2111, name: "NRL" },
];

export const SPORT_TABS: { key: SportKey; label: string; icon: string }[] = [
  { key: "soccer",     label: "Football",   icon: "F" },
  { key: "basketball", label: "Basketball", icon: "B" },
  { key: "football",   label: "NFL",        icon: "N" },
  { key: "baseball",   label: "Baseball",   icon: "b" },
  { key: "hockey",     label: "Hockey",     icon: "H" },
  { key: "tennis",     label: "Tennis",     icon: "T" },
  { key: "mma",        label: "MMA",        icon: "M" },
  { key: "golf",       label: "Golf",       icon: "G" },
  { key: "rugby",      label: "Rugby",      icon: "R" },
];

export function leaguesForSport(sport: SportKey): LeagueConfig[] {
  return LEAGUES.filter((l) => l.sport === sport);
}