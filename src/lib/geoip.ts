import maxmind, { CityResponse } from "maxmind";
import path from "path";

let lookup: ((ip: string) => CityResponse | null) | null = null;

async function getLookup() {
  if (lookup) return lookup;
  const dbPath = path.resolve(process.env.GEOIP_DB_PATH ?? "./data/GeoLite2-City.mmdb");
  const reader = await maxmind.open<CityResponse>(dbPath);
  lookup = (ip: string) => reader.get(ip) ?? null;
  return lookup;
}

export async function lookupIp(ip: string) {
  try {
    if (
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("127.") ||
      ip === "::1" ||
      ip === "unknown"
    ) {
      return { country: "Local", city: "Local", region: "Local" };
    }
    const fn = await getLookup();
    const result = fn(ip);
    if (!result) return { country: null, city: null, region: null };
    return {
      country: result.country?.iso_code ?? null,
      city: result.city?.names?.en ?? null,
      region: result.subdivisions?.[0]?.names?.en ?? null,
    };
  } catch (err) {
    console.error("GeoIP lookup failed:", err);
    return { country: null, city: null, region: null };
  }
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
