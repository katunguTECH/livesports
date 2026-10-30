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
        <span className="whitespace-nowrap font-mono text-[13px] font-medium text-foreground-muted">
          {team.linescoreText}
        </span>
      );
    }
    if (team.scoreText) {
      return (
        <span className="whitespace-nowrap font-mono text-[13px] font-medium text-foreground-muted">
          {team.scoreText}
        </span>
      );
    }
    if (team.score !== null) {
      return (
        <span className="font-mono text-lg font-bold tabular-nums text-foreground">
          {team.score}
        </span>
      );
    }
    return null;
  };

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all hover:border-border-strong hover:shadow-sm">
      <div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
            {sportLabel} &middot; {leagueName}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-live px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {statusDetail}
            </span>
          )}
          {isFinished && (
            <span className="whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
              {statusDetail || "Final"}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-[15px] font-semibold text-foreground">
              {home.shortName}
            </p>
            {(isLive || isFinished) && renderScore(home)}
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-[15px] font-semibold text-foreground">
              {away.shortName}
            </p>
            {(isLive || isFinished) && renderScore(away)}
          </div>
        </div>

        {status === "scheduled" && (
          <p className="mt-3 text-xs font-medium text-foreground-muted">
            {new Date(startTime).toLocaleString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
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