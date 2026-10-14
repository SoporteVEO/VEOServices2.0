import { cn } from "@/lib/utils";
import { barTone } from "./pantallas-logic";

const TONE_CLASS = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  over: "bg-red-500",
};

export function OccupancyBar({
  pct,
  pausedPct = 0,
  className,
}: {
  pct: number;
  pausedPct?: number;
  className?: string;
}) {
  const filled = Math.min(100, Math.max(0, pct));
  const paused = Math.min(100 - filled, Math.max(0, pausedPct));
  return (
    <div className={cn("flex h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full transition-all", TONE_CLASS[barTone(pct)])} style={{ width: `${filled}%` }} />
      {paused > 0 ? (
        <div className="h-full bg-violet-400/70" style={{ width: `${paused}%` }} />
      ) : null}
    </div>
  );
}
