// src/components/RegionSelector.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const REGIONS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "KE", label: "Kenya" },
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "BR", label: "Brazil" },
  { code: "IN", label: "India" },
  { code: "JP", label: "Japan" },
  { code: "AU", label: "Australia" },
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
        Broadcasters for:
      </label>
      <select
        id="region"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-3 py-1.5 text-sm bg-white"
      >
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.code} - {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}