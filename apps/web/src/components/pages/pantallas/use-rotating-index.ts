"use client";

import { useEffect, useState } from "react";

export function useRotatingIndex(length: number, intervalMs: number) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (length < 2) return;
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [length, intervalMs]);

  return length ? tick % length : 0;
}
