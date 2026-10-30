// src/components/EventCard.tsx
import type { Fixture } from "@/lib/api";
import type { MatchedBroadcaster } from "@/lib/broadcaster-matcher";

type Props = {
  fixture: Fixture & { broadcasters: MatchedBroadcaster[] };
};

export default function EventCard({ fixture }: Props) {
  const {
    home,
    away,
    leagueName,
    sportLabel,
    status,
    statusDetail,
    startTime,
    broadcasters,
  } = fixture;

  const isLive = status === "live";
  const isFinished = status === "finished";

  const renderScore = (team: typeof home) => {
    if (team.linescoreText) {
      return (
        <span className="text-xs font-mono text-gray-700 whitespace-nowrap">
          {team.linescoreText}
        </span>
      );
    }
    if (team.scoreText) {
      return (
        <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
          {team.scoreText}
        </span>
      );
    }
    if (team.score !== null) {
      return (
        <span className="text-xl font-bold tabular-nums">{team.score}</span>
      );
    }
    return null;
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase truncate">
            {sportLabel} &middot; {leagueName}
          </span>
          {isLive && (
            <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded whitespace-nowrap">
              LIVE {statusDetail}
            </span>
          )}
          {isFinished && (
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
              {statusDetail || "FT"}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold text-base truncate">{home.shortName}</p>
          {(isLive || isFinished) && renderScore(home)}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold text-base truncate">{away.shortName}</p>
          {(isLive || isFinished) && renderScore(away)}
        </div>

        {status === "scheduled" && (
          <p className="text-sm text-gray-600 mt-2">
            {new Date(startTime).toLocaleString()}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t">
        {broadcasters.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {broadcasters.slice(0, 4).map((b, i) => (
              <a
                key={`${b.countryCode}-${b.name}-${i}`}
                href={b.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition"
              >
                <span className="font-mono text-[10px] opacity-70">
                  {b.countryCode}
                </span>
                {b.name}
              </a>
            ))}
            {broadcasters.length > 4 && (
              <span className="text-xs text-gray-400 self-center">
                +{broadcasters.length - 4} more
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No broadcaster listed yet.</p>
        )}
      </div>
    </div>
  );
}