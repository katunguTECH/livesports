// src/components/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm transition group-hover:shadow-md">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 text-primary-foreground"
              >
                <path
                  d="M8 5.5v13l11-6.5-11-6.5z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                LiveSports
              </span>
              <span className="text-[11px] font-medium text-foreground-subtle">
                Global broadcast directory
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Live &middot; 9 sports
            </span>
            <span className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
              Beta
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}