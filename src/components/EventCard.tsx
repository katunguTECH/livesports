
"use client";

import type { Fixture } from "@/lib/api";
import type { MatchedBroadcaster } from "@/lib/broadcaster-matcher";
import CommunityLinks from "@/components/CommunityLinks";

type CommunityLink = {
  id: number;
  fixtureId: string;
  title: string | null;
  url: string;
  status: string;
  createdAt: string;
};

type Props = {
  fixture: Fixture & { broadcasters: MatchedBroadcaster[] };
  communityLinks: CommunityLink[];
};

export default function EventCard({
  fixture,
  communityLinks,
}: Props) {
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
        <span className="font-mono text-[13px] text-foreground-muted">
          {team.linescoreText}
        </span>
      );
    }

    if (team.scoreText) {
      return (
        <span className="font-mono text-[13px] text-foreground-muted">
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

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return "Time unavailable";
    }

    const days = [
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
    ];

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${dayName} ${dayNum} ${monthName}, ${hours}:${minutes}`;
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
            {formatDate(startTime)}
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
                data-track="broadcaster"
                data-label={b.name}
                data-country={b.countryCode}
                data-match={`${home.shortName} vs ${away.shortName}`}
                data-league={leagueName}
                data-fixture={fixture.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-foreground-muted hover:bg-chip"
              >
                <span className="font-mono text-[9px] font-bold opacity-70">
                  {b.countryCode}
                </span>
                {b.name}
              </a>
            ))}
          </>
        ) : (
          <p className="text-xs text-foreground-subtle">
            No broadcaster listed
          </p>
        )}
      </div>

      <CommunityLinks
        fixture={fixture}
        initialLinks={communityLinks}
      />
    </article>
  );
}
