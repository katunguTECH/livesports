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
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {SPORT_TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={`/?region=${region}&sport=${t.key}`}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.icon} {t.label}
          </Link>
        );
      })}
    </div>
  );
}