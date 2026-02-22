"use client";

import { useEffect, useState } from "react";

export type LiveWindow = "1h" | "6h" | "24h";

const KEY = "archalert_live_window";

export function useLiveWindow(defaultVal: LiveWindow = "6h") {
  const [since, setSinceState] = useState<LiveWindow>(defaultVal);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY) as LiveWindow | null;
      if (v === "1h" || v === "6h" || v === "24h") setSinceState(v);
      else setSinceState(defaultVal);
    } catch {
      setSinceState(defaultVal);
    }
  }, [defaultVal]);

  const setSince = (v: LiveWindow) => {
    setSinceState(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };

  return { since, setSince };
}