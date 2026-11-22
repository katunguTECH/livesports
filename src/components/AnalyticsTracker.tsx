"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

let firstView = true;

function getVisitorId(): string {
  try {
    let id = localStorage.getItem("s4l_vid");
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("s4l_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify({ ...payload, visitorId: getVisitorId() });

  try {
    if (
      navigator.sendBeacon &&
      navigator.sendBeacon(
        "/api/track",
        new Blob([body], { type: "application/json" })
      )
    ) {
      return;
    }
  } catch {
    /* fall through to fetch */
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  // Page views
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    send({
      type: "visit",
      path: pathname + window.location.search,
      referrer: firstView ? document.referrer : "",
    });
    firstView = false;
  }, [pathname]);

  // Outbound link clicks (broadcasters, community links, any external link)
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (window.location.pathname.startsWith("/admin")) return;
      if (event.type === "auxclick" && event.button !== 1) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest("a");
      if (!anchor || !anchor.href) return;

      let target: URL;
      try {
        target = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (!["http:", "https:"].includes(target.protocol)) return;
      if (target.origin === window.location.origin) return;

      const ds = anchor.dataset;

      send({
        type: "click",
        kind: ds.track || "external",
        label: ds.label || anchor.textContent?.trim() || target.hostname,
        url: target.toString(),
        match: ds.match || null,
        league: ds.league || null,
        fixtureId: ds.fixture || null,
        country: ds.country || null,
      });
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  return null;
}
