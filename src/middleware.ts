import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. If the user manually selected a region via the dropdown, respect it.
  if (request.nextUrl.searchParams.has("region")) {
    return response;
  }

  // 2. Try to detect country from standard CDN headers (Cloudflare, Vercel, etc.)
  let country = request.headers.get("cf-ipcountry") || 
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