
"use client";

import { useEffect, useState } from "react";
import type { Fixture } from "@/lib/api";

type Props = {
  fixture: Fixture;
  initialLinks?: CommunityLink[];
};

type CommunityLink = {
  id: number;
  fixtureId: string;
  title: string | null;
  url: string;
  status: string;
  createdAt: string;
};

export default function CommunityLinks({
  fixture,
  initialLinks,
}: Props) {
  const [links, setLinks] = useState<CommunityLink[]>(
    initialLinks ?? []
  );
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(initialLinks === undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialLinks !== undefined) {
      setLinks(initialLinks);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadLinks() {
      try {
        const response = await fetch(
          `/api/community-links?fixtureId=${encodeURIComponent(fixture.id)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load community links.");
        }

        if (active) {
          setLinks(data.links || []);
        }
      } catch {
        if (active) {
          setError("Community links could not be loaded.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLinks();

    return () => {
      active = false;
    };
  }, [fixture.id, initialLinks]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!url.trim()) {
      setError("Please enter a viewing link.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/community-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fixtureId: fixture.id,
          sport: fixture.sport,
          leagueName: fixture.leagueName,
          homeName: fixture.home.shortName,
          awayName: fixture.away.shortName,
          title: title.trim(),
          url: url.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your link.");
      }

      setLinks((current) => [data.link, ...current]);
      setTitle("");
      setUrl("");
      setMessage("Your link has been published and marked Unverified.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-4 border-t border-border pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
          Community viewing links
        </h3>

        <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">
          Unverified
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-foreground-muted">
          Loading community links...
        </p>
      ) : links.length > 0 ? (
        <div className="mb-4 space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-muted p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {link.title || link.url}
                </p>
                <p className="text-[10px] text-foreground-muted">
                  Community submission · Unverified
                </p>
              </div>

              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-track="community"
                data-label={link.title || link.url}
                data-match={`${fixture.home.shortName} vs ${fixture.away.shortName}`}
                data-league={fixture.leagueName}
                data-fixture={fixture.id}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Open link
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-xs text-foreground-muted">
          No community links submitted for this match yet.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          placeholder="Link title (optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground"
        />

        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          maxLength={2048}
          required
          placeholder="Paste a viewing link (https://...)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-chip disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit a Viewing Link"}
        </button>
      </form>

      {message && (
        <p className="mt-2 text-xs text-green-600">{message}</p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      <p className="mt-2 text-[10px] leading-relaxed text-foreground-muted">
        Only submit links you are authorised to share. Community links are
        user-submitted and have not been verified by LiveSportsGlobal.
      </p>
    </section>
  );
}
