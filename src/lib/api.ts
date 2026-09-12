// src/lib/api.ts
const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = process.env.API_SPORTS_BASE_URL ?? "https://v3.football.api-sports.io";

export interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string; elapsed: number | null };
  };
  league: { id: number; name: string; logo: string; country: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

export async function getLiveAndUpcomingFixtures(): Promise<Fixture[]> {
  if (!API_KEY) {
    console.error("API_SPORTS_KEY is missing from .env.local");
    return [];
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(`${BASE_URL}/fixtures?date=${today}`, {
      headers: { "x-apisports-key": API_KEY },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`Sports API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("Sports API errors:", data.errors);
      return [];
    }

    return (data.response ?? []) as Fixture[];
  } catch (err) {
    console.error("Failed to fetch fixtures:", err);
    return [];
  }
}