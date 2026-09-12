// src/components/EventCard.tsx
import type { Fixture } from "@/lib/api";
import type { Broadcaster } from "@/generated/prisma/client";

type FixtureWithBroadcaster = Fixture & { broadcaster: Broadcaster | null };

export default function EventCard({ fixture }: { fixture: FixtureWithBroadcaster }) {
  const { teams, goals, fixture: f, league, broadcaster } = fixture;
  const isLive = ["1H", "2H", "HT", "ET", "LIVE"].includes(f.status.short);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase">{league.name}</span>
          {isLive && (
            <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded">
              LIVE {f.status.elapsed}&apos;
            </span>
          )}
        </div>

        <p className="font-semibold text-lg mb-1">
          {teams.home.name} vs {teams.away.name}
        </p>

        {isLive ? (
          <p className="text-2xl font-bold tabular-nums">
            {goals.home ?? 0} &ndash; {goals.away ?? 0}
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            {new Date(f.date).toLocaleString()}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t">
        {broadcaster ? (
          <a
            href={broadcaster.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition font-medium"
          >
            Watch on {broadcaster.name}
          </a>
        ) : (
          <p className="text-xs text-gray-400">No broadcaster info for your region.</p>
        )}
      </div>
    </div>
  );
}