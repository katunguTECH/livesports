// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-primary-foreground">
                  <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">LiveSports</span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-foreground-muted">
              A global directory of legal sports broadcasters. We don&apos;t host streams — we help you find where to watch.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              Sports
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/?sport=soccer" className="text-foreground-muted hover:text-foreground">Football</Link></li>
              <li><Link href="/?sport=basketball" className="text-foreground-muted hover:text-foreground">Basketball</Link></li>
              <li><Link href="/?sport=football" className="text-foreground-muted hover:text-foreground">NFL</Link></li>
              <li><Link href="/?sport=tennis" className="text-foreground-muted hover:text-foreground">Tennis</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              Legal
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/privacy" className="text-foreground-muted hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="text-foreground-muted hover:text-foreground">Terms</Link></li>
              <li><Link href="/dmca" className="text-foreground-muted hover:text-foreground">DMCA</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              Contact
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="mailto:hello@livesports.app" className="text-foreground-muted hover:text-foreground">
                  hello@livesports.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-[11px] leading-relaxed text-foreground-subtle">
            <strong className="font-semibold text-foreground-muted">Affiliate disclosure:</strong>{" "}
            This site contains affiliate links. If you subscribe to a broadcaster through one of our links, we may earn a commission at no extra cost to you.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-foreground-subtle">
            LiveSports does not host, stream, or redistribute any video content. All broadcaster links point to official third-party services. Availability varies by region.
          </p>
          <p className="mt-4 text-[11px] text-foreground-subtle">
            &copy; {new Date().getFullYear()} LiveSports. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}