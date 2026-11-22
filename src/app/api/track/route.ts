import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getClientIp, getGeo } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests/i;

const KINDS = new Set(["broadcaster", "community", "external"]);

// Very small in-memory rate limit: 90 events per IP per minute.
const hits = new Map<string, { count: number; reset: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || entry.reset < now) {
    if (hits.size > 10_000) hits.clear();
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }

  entry.count += 1;
  return entry.count > 90;
}

function clip(value: unknown, max: number): string | null {
  const s = String(value ?? "").trim();
  return s ? s.slice(0, max) : null;
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") ?? "";
    if (!userAgent || BOT_RE.test(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const ip = getClientIp(request.headers);
    if (ip && limited(ip)) {
      return new NextResponse(null, { status: 429 });
    }

    const geo = await getGeo(request.headers, ip);
    const prisma = getPrisma();
    const visitorId = clip(body.visitorId, 64);

    if (body.type === "visit") {
      const path = clip(body.path, 300);
      if (!path || !path.startsWith("/") || path.startsWith("/admin")) {
        return new NextResponse(null, { status: 204 });
      }

      await prisma.pageVisit.create({
        data: {
          path,
          referrer: clip(body.referrer, 500),
          ip,
          country: geo.country,
          city: geo.city,
          region: geo.region,
          userAgent: userAgent.slice(0, 300),
          visitorId,
        },
      });

      return new NextResponse(null, { status: 204 });
    }

    if (body.type === "click") {
      const rawUrl = clip(body.url, 2048);
      let url: URL;
      try {
        url = new URL(rawUrl ?? "");
      } catch {
        return NextResponse.json({ error: "Bad url" }, { status: 400 });
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        return NextResponse.json({ error: "Bad url" }, { status: 400 });
      }

      const kind = KINDS.has(String(body.kind)) ? String(body.kind) : "external";

      await prisma.clickEvent.create({
        data: {
          kind,
          label: clip(body.label, 150) ?? url.hostname,
          url: url.toString().slice(0, 2048),
          match: clip(body.match, 200),
          leagueName: clip(body.league, 150),
          fixtureId: clip(body.fixtureId, 300),
          broadcasterCountry: clip(body.country, 10),
          ip,
          country: geo.country,
          city: geo.city,
          visitorId,
        },
      });

      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  } catch (error) {
    console.error("Analytics tracking failed:", error);
    return new NextResponse(null, { status: 204 });
  }
}
