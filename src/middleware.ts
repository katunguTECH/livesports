import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function trackVisit(request: NextRequest) {
  // Fire-and-forget POST to our own tracking endpoint.
  // We don't await — the user's page load shouldn't wait for analytics.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const body = {
    path: request.nextUrl.pathname + request.nextUrl.search,
    ip,
    userAgent: request.headers.get("user-agent") ?? "",
    referrer: request.headers.get("referer") ?? "",
  };

  // Use the request origin so this works in dev and prod without config.
  const url = new URL("/api/track-visit", request.url);

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    // Swallow — tracking failures should never break the page.
  });
}

export function middleware(request: NextRequest) {
  // Record the visit (async, non-blocking)
  trackVisit(request);

  const response = NextResponse.next();

  // 1. If the user manually selected a region via the dropdown, respect it.
  if (request.nextUrl.searchParams.has("region")) {
    return response;
  }

  // 2. Try to detect country from standard CDN headers (Cloudflare, Vercel, etc.)
  let country =
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("x-nf-request-country"); // Northflank specific

  // 3. If no header is found, we will let the page component handle the API fallback.
  if (country && country !== "XX") {
    // Rewrite the URL to include the region, so your page reads it automatically
    const url = request.nextUrl.clone();
    url.searchParams.set("region", country.toUpperCase());
    return NextResponse.rewrite(url);
  }

  return response;
}

// Only run this middleware on the homepage
export const config = {
  matcher: "/",
};