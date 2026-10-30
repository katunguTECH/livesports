// src/components/TournamentCard.tsx
import type { GolfTournament } from "@/lib/api";
import type { MatchedBroadcaster } from "@/lib/broadcaster-matcher";

type Props = {
  tournament: GolfTournament & { broadcasters: MatchedBroadcaster[] };
};

export default function TournamentCard({ tournament }: Props) {
  const { name, leagueName, status, statusDetail, startTime, leaderboard, broadcasters } = tournament;
  const isLive = status === "live";
  const isFinished = status === "finished";

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase truncate">
            Golf &middot; {leagueName}
          </span>
          {isLive && (
            <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded whitespace-nowrap">
              LIVE {statusDetail}
            </span>
          )}
          {isFinished && (
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
              {statusDetail || "Final"}
            </span>
          )}
        </div>

        <p className="font-semibold text-base mb-2 truncate">{name}</p>

        {status === "scheduled" && (
          <p className="text-sm text-gray-600 mb-2">
            {new Date(startTime).toLocaleString()}
          </p>
        )}

        {leaderboard.length > 0 && (
          <ol className="text-sm space-y-1">
            {leaderboard.map((p, i) => (
              <li key={`${p.name}-${i}`} className="flex justify-between gap-2">
                <span className="truncate">
                  <span className="text-gray-400 mr-2">{p.position}</span>
                  {p.name}
                </span>
                <span className="font-mono tabular-nums">{p.score}</span>
              </li>
            ))}
          </ol>
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
                <span className="font-mono text-[10px] opacity-70">{b.countryCode}</span>
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