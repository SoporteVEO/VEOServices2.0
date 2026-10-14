"use client";

import type { Screen } from "@/api/pantallas/pantallas.types";
import { Card, CardContent } from "@/components/primitives/ui/card";
import { cn } from "@/lib/utils";
import { FULL_SUBLIST_SPOTS, TONE_DOT_CLASS, type StatusTone } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import { formatClock12, formatCount, formatHours, plural } from "./pantallas-format";
import { screenStats } from "./pantallas-logic";
import { OccupancyBar } from "./occupancy-bar";

function Chip({ tone, children }: { tone?: StatusTone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
      {tone ? <span className={cn("size-1.5", TONE_DOT_CLASS[tone])} /> : null}
      {children}
    </span>
  );
}

export function ScreenSummaryCard({ screen }: { screen: Screen }) {
  const { board, refDate, goToScreen } = usePantallas();
  const stats = screenStats(screen, board.settings, refDate);
  const needed = Math.floor(stats.capacity / FULL_SUBLIST_SPOTS);
  const { ACTIVE, EXPIRING, PAUSED, FINISHED, SCHEDULED } = stats.byStatus;

  return (
    <Card
      size="sm"
      onClick={() => goToScreen(screen.id)}
      className="cursor-pointer border border-border/80 py-4 shadow-none ring-0 transition-colors hover:bg-accent/30"
    >
      <CardContent className="flex flex-col gap-2 px-4 py-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold">{screen.name}</h3>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatHours(stats.hours)} · {formatCount(stats.capacity)}
          </span>
        </div>
        <p className="-mt-1 text-xs text-muted-foreground">
          {formatClock12(screen.turnOnAt)} — {formatClock12(screen.turnOffAt)}
        </p>
        <div className="flex items-baseline gap-2">
          <b className={cn("text-lg tabular-nums", stats.pct > 100.5 && "text-red-600")}>
            {stats.pct.toFixed(0)}%
          </b>
          <span className="text-xs text-muted-foreground">
            {formatCount(stats.used)} / {formatCount(stats.capacity)} spots
          </span>
        </div>
        <OccupancyBar pct={stats.pct} />
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Chip tone="good">{ACTIVE} activas</Chip>
          {EXPIRING ? <Chip tone="warning">{EXPIRING} por vencer</Chip> : null}
          {PAUSED ? (
            <Chip tone="paused">
              {PAUSED} {plural(PAUSED, "pausada")} · {formatCount(stats.pausedSpots)}
            </Chip>
          ) : null}
          {FINISHED ? <Chip tone="critical">{FINISHED} finalizadas</Chip> : null}
          {SCHEDULED ? <Chip tone="accent">{SCHEDULED} programadas</Chip> : null}
          <Chip tone="muted">
            {stats.sublists} sublistas{stats.sublists < needed ? ` de ${needed}` : ""}
          </Chip>
          <Chip>
            <span className={stats.free < 0 ? "text-red-600" : undefined}>
              {stats.free >= 0
                ? `${formatCount(stats.free)} libres`
                : `${formatCount(-stats.free)} sobrevendidos`}
            </span>
          </Chip>
        </div>
      </CardContent>
    </Card>
  );
}
