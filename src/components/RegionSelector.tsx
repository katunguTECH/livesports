// src/components/RegionSelector.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const REGIONS: { code: string; label: string; flag: string }[] = [
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "KE", label: "Kenya", flag: "🇰🇪" },
  { code: "NG", label: "Nigeria", flag: "🇳🇬" },
  { code: "ZA", label: "South Africa", flag: "🇿🇦" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "ES", label: "Spain", flag: "🇪🇸" },
  { code: "IT", label: "Italy", flag: "🇮🇹" },
  { code: "BR", label: "Brazil", flag: "🇧🇷" },
  { code: "IN", label: "India", flag: "🇮🇳" },
  { code: "JP", label: "Japan", flag: "🇯🇵" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
];

export default function RegionSelector({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("region", code);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 mb-6">
      <label htmlFor="region" className="text-sm font-medium text-gray-700">
        Region:
      </label>
      <select
        id="region"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-3 py-1.5 text-sm bg-white"
      >
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.flag} {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}