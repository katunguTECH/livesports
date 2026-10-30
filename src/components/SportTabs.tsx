// src/components/SportTabs.tsx
import Link from "next/link";
import { SPORT_TABS, type SportKey } from "@/lib/leagues";

export default function SportTabs({
  active,
  region,
}: {
  active: SportKey;
  region: string;
}) {
  return (
    <nav className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1 pb-1">
        {SPORT_TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              href={`/?region=${region}&sport=${t.key}`}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}