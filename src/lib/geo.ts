// src/lib/geo.ts
// Works out the visitor's IP and location. Uses CDN/host headers when present
// (Cloudflare, Vercel, Northflank) and falls back to a free IP lookup service.

export type Geo = {
  country: string | null;
  city: string | null;
  region: string | null;
};

const cache = new Map<string, Geo>();

const PRIVATE_IP =
  /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80)/i;

export function getClientIp(h: Headers): string | null {
  const raw =
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0] ||
    null;

  if (!raw) return null;

  const ip = raw.trim().replace(/^::ffff:/i, "");
  return ip ? ip.slice(0, 64) : null;
}

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  let v = value.trim();
  try {
    v = decodeURIComponent(v);
  } catch {
    /* keep raw value */
  }
  if (!v || v === "XX" || v === "T1") return null;
  return v.slice(0, 100);
}

export async function getGeo(h: Headers, ip: string | null): Promise<Geo> {
  const geo: Geo = {
    country: clean(
      h.get("cf-ipcountry") ||
        h.get("x-vercel-ip-country") ||
        h.get("x-nf-request-country")
    ),
    city: clean(h.get("x-vercel-ip-city") || h.get("cf-ipcity")),
    region: clean(h.get("x-vercel-ip-country-region") || h.get("cf-region")),
  };

  if (geo.country) geo.country = geo.country.toUpperCase().slice(0, 2);

  if ((geo.country && geo.city) || !ip || PRIVATE_IP.test(ip)) {
    return geo;
  }

  const cached = cache.get(ip);
  if (cached) {
    return {
      country: geo.country ?? cached.country,
      city: geo.city ?? cached.city,
      region: geo.region ?? cached.region,
    };
  }

  try {
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code,city,region`,
      { signal: AbortSignal.timeout(2500), cache: "no-store" }
    );
    const data = await res.json();

    if (data?.success) {
      const looked: Geo = {
        country: clean(data.country_code)?.toUpperCase().slice(0, 2) ?? null,
        city: clean(data.city),
        region: clean(data.region),
      };

      if (cache.size > 5000) cache.clear();
      cache.set(ip, looked);

      return {
        country: geo.country ?? looked.country,
        city: geo.city ?? looked.city,
        region: geo.region ?? looked.region,
      };
    }
  } catch {
    /* lookup failed - keep whatever the headers gave us */
  }

  return geo;
}
