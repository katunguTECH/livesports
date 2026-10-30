// src/components/TournamentCard.tsx
import type { GolfTournament } from "@/lib/api";
import type { MatchedBroadcaster } from "@/lib/broadcaster-matcher";

type Props = {
  tournament: GolfTournament & { broadcasters: MatchedBroadcaster[] };
};

export default function TournamentCard({ tournament }: Props) {
  const {
    name,
    leagueName,
    status,
    statusDetail,
    startTime,
    leaderboard,
    broadcasters,
  } = tournament;

  const isLive = status === "live";
  const isFinished = status === "finished";

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all hover:border-border-strong hover:shadow-sm">
      <div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
            Golf &middot; {leagueName}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-live px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          )}
          {isFinished && (
            <span className="whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
              {statusDetail || "Final"}
            </span>
          )}
        </div>

        <p className="mb-3 truncate text-[15px] font-semibold text-foreground">
          {name}
        </p>

        {status === "scheduled" && (
          <p className="mb-3 text-xs font-medium text-foreground-muted">
            {new Date(startTime).toLocaleString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        {leaderboard.length > 0 && (
          <ol className="space-y-1.5">
            {leaderboard.map((p, i) => (
              <li
                key={`${p.name}-${i}`}
                className="flex items-baseline justify-between gap-3 text-xs"
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="w-4 flex-shrink-0 font-mono text-[10px] font-semibold text-foreground-subtle">
                    {p.position}
                  </span>
                  <span className="truncate font-medium text-foreground">
                    {p.name}
                  </span>
                </span>
                <span className="flex-shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground">
                  {p.score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border pt-4">
        {broadcasters.length > 0 ? (
          <>
            {broadcasters.slice(0, 4).map((b, i) => (
              <a
                key={`${b.countryCode}-${b.name}-${i}`}
                href={b.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-foreground-muted transition-colors hover:border-primary/20 hover:bg-chip hover:text-chip-foreground"
                title={`${b.name} (${b.countryCode})`}
              >
                <span className="font-mono text-[9px] font-bold opacity-70">
                  {b.countryCode}
                </span>
                {b.name}
              </a>
            ))}
            {broadcasters.length > 4 && (
              <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium text-foreground-subtle">
                +{broadcasters.length - 4}
              </span>
            )}
          </>
        ) : (
          <p className="text-xs text-foreground-subtle">No broadcaster listed</p>
        )}
      </div>
    </article>
  );
}