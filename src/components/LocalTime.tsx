// src/components/LocalTime.tsx
"use client";

import { useEffect, useState } from "react";

const FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

export default function LocalTime({
  iso,
  fallback,
}: {
  iso: string;
  fallback?: string;
}) {
  const [text, setText] = useState<string>(fallback ?? "");

  useEffect(() => {
    try {
      setText(new Date(iso).toLocaleString(undefined, FORMAT));
    } catch {
      setText(fallback ?? iso);
    }
  }, [iso, fallback]);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text || fallback || "..."}
    </time>
  );
}