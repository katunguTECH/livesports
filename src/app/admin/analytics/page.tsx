import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const RANGES = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

function countryName(code: string | null): string {
  if (!code || code === "??") return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function formatTime(d: Date): string {
  return d.toLocaleString("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-sm text-gray-500 uppercase">{title}</h2>
      <p className="text-4xl font-bold text-gray-900">
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg shadow-sm border p-5">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-gray-500">No data yet.</p>;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const requested = Number(params.days);
  const days = RANGES.some((r) => r.days === requested) ? requested : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const prisma = getPrisma();

  const [
    totalsRows,
    clickTotalRows,
    daily,
    countries,
    cities,
    pages,
    topLinks,
    topMatches,
    recentVisits,
    recentClicks,
  ] = await Promise.all([
    prisma.$queryRaw<{ views: number; visitors: number; ips: number }[]>`
      SELECT COUNT(*)::int AS views,
             COUNT(DISTINCT "visitorId")::int AS visitors,
             COUNT(DISTINCT "ip")::int AS ips
      FROM "PageVisit" WHERE "createdAt" >= ${since}`,
    prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM "ClickEvent" WHERE "createdAt" >= ${since}`,
    prisma.$queryRaw<{ day: string; views: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS views
      FROM "PageVisit" WHERE "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ country: string; views: number; visitors: number }[]>`
      SELECT COALESCE("country", '??') AS country,
             COUNT(*)::int AS views,
             COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "PageVisit" WHERE "createdAt" >= ${since}
      GROUP BY 1 ORDER BY views DESC LIMIT 15`,
    prisma.$queryRaw<{ city: string; country: string; views: number }[]>`
      SELECT COALESCE("city", 'Unknown') AS city,
             COALESCE("country", '??') AS country,
             COUNT(*)::int AS views
      FROM "PageVisit" WHERE "createdAt" >= ${since}
      GROUP BY 1, 2 ORDER BY views DESC LIMIT 15`,
    prisma.$queryRaw<{ path: string; views: number }[]>`
      SELECT "path", COUNT(*)::int AS views
      FROM "PageVisit" WHERE "createdAt" >= ${since}
      GROUP BY "path" ORDER BY views DESC LIMIT 10`,
    prisma.$queryRaw<
      { kind: string; label: string; url: string; clicks: number }[]
    >`
      SELECT "kind", "label", MAX("url") AS url, COUNT(*)::int AS clicks
      FROM "ClickEvent" WHERE "createdAt" >= ${since}
      GROUP BY "kind", "label" ORDER BY clicks DESC LIMIT 20`,
    prisma.$queryRaw<{ match: string; league: string | null; clicks: number }[]>`
      SELECT "match", MAX("leagueName") AS league, COUNT(*)::int AS clicks
      FROM "ClickEvent"
      WHERE "createdAt" >= ${since} AND "match" IS NOT NULL
      GROUP BY "match" ORDER BY clicks DESC LIMIT 15`,
    prisma.pageVisit.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.clickEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const totals = totalsRows[0] ?? { views: 0, visitors: 0, ips: 0 };
  const totalClicks = clickTotalRows[0]?.n ?? 0;
  const maxDaily = Math.max(1, ...daily.map((d) => d.views));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/admin/analytics?days=${r.days}`}
              className={`px-3 py-1.5 rounded text-sm border ${
                r.days === days
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Page views" value={totals.views} />
        <Card title="Unique visitors" value={totals.visitors} />
        <Card title="Unique IPs" value={totals.ips} />
        <Card title="Link clicks" value={totalClicks} />
      </div>

      <Panel title="Views per day (UTC)">
        {daily.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex items-end gap-1 h-40">
            {daily.map((d) => (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center justify-end h-full"
                title={`${d.day}: ${d.views} views`}
              >
                <span className="text-[10px] text-gray-500">{d.views}</span>
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${Math.max(4, (d.views / maxDaily) * 100)}%` }}
                />
                <span className="text-[9px] text-gray-400 mt-1">
                  {d.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Top countries">
          {countries.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">Country</th>
                  <th className="py-1 text-right">Views</th>
                  <th className="py-1 text-right">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.country} className="border-t">
                    <td className="py-1.5">
                      {countryName(c.country)}{" "}
                      <span className="text-gray-400">({c.country})</span>
                    </td>
                    <td className="py-1.5 text-right">{c.views}</td>
                    <td className="py-1.5 text-right">{c.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Top cities">
          {cities.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">City</th>
                  <th className="py-1">Country</th>
                  <th className="py-1 text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr key={`${c.city}-${c.country}`} className="border-t">
                    <td className="py-1.5">{c.city}</td>
                    <td className="py-1.5">{countryName(c.country)}</td>
                    <td className="py-1.5 text-right">{c.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Most clicked games / matches">
          {topMatches.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">Match</th>
                  <th className="py-1">League</th>
                  <th className="py-1 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {topMatches.map((m) => (
                  <tr key={m.match} className="border-t">
                    <td className="py-1.5">{m.match}</td>
                    <td className="py-1.5 text-gray-500">{m.league ?? "-"}</td>
                    <td className="py-1.5 text-right font-semibold">
                      {m.clicks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Most clicked links">
          {topLinks.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1">Link</th>
                  <th className="py-1">Type</th>
                  <th className="py-1 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {topLinks.map((l) => (
                  <tr key={`${l.kind}-${l.label}`} className="border-t">
                    <td className="py-1.5 max-w-[16rem]">
                      <div className="truncate font-medium">{l.label}</div>
                      <div className="truncate text-xs text-gray-400">
                        {l.url}
                      </div>
                    </td>
                    <td className="py-1.5 text-gray-500">{l.kind}</td>
                    <td className="py-1.5 text-right font-semibold">
                      {l.clicks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Top pages">
          {pages.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {pages.map((p) => (
                  <tr key={p.path} className="border-t first:border-t-0">
                    <td className="py-1.5 truncate max-w-[20rem]">{p.path}</td>
                    <td className="py-1.5 text-right">{p.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <Panel title="Recent visits (last 100, Nairobi time)">
        {recentVisits.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1 pr-4">Time</th>
                  <th className="py-1 pr-4">IP address</th>
                  <th className="py-1 pr-4">Country</th>
                  <th className="py-1 pr-4">City</th>
                  <th className="py-1 pr-4">Page</th>
                  <th className="py-1">Referrer</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="py-1.5 pr-4">{formatTime(v.createdAt)}</td>
                    <td className="py-1.5 pr-4 font-mono text-xs">
                      {v.ip ?? "-"}
                    </td>
                    <td className="py-1.5 pr-4">
                      {v.country ? countryName(v.country) : "-"}
                    </td>
                    <td className="py-1.5 pr-4">{v.city ?? "-"}</td>
                    <td className="py-1.5 pr-4 max-w-[14rem] truncate">
                      {v.path}
                    </td>
                    <td className="py-1.5 max-w-[14rem] truncate text-gray-500">
                      {v.referrer || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Recent clicks (last 50)">
        {recentClicks.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1 pr-4">Time</th>
                  <th className="py-1 pr-4">IP address</th>
                  <th className="py-1 pr-4">Country</th>
                  <th className="py-1 pr-4">Clicked</th>
                  <th className="py-1">Match</th>
                </tr>
              </thead>
              <tbody>
                {recentClicks.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-1.5 pr-4">{formatTime(c.createdAt)}</td>
                    <td className="py-1.5 pr-4 font-mono text-xs">
                      {c.ip ?? "-"}
                    </td>
                    <td className="py-1.5 pr-4">
                      {c.country ? countryName(c.country) : "-"}
                    </td>
                    <td className="py-1.5 pr-4 max-w-[14rem] truncate">
                      {c.label}
                    </td>
                    <td className="py-1.5 max-w-[16rem] truncate text-gray-500">
                      {c.match ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
