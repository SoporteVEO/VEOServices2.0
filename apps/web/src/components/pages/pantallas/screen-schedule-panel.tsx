"use client";

import { ArrowDown, ArrowLeftRight, ArrowUp, Check, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useUpdatePantallasSettings, useUpdateScreen } from "@/api/pantallas/pantallas.mutations";
import type { Screen } from "@/api/pantallas/pantallas.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { DURATION_PRESETS } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import {
  formatClock12,
  formatCount,
  formatHours,
  formatShortHours,
  minutesOf,
  toHHMM,
} from "./pantallas-format";
import { scheduleSuggestion, type ScheduleSuggestionType, type ScreenStats } from "./pantallas-logic";

const SUGGESTION_STYLE: Record<
  ScheduleSuggestionType,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  up: { icon: ArrowUp, className: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400" },
  down: { icon: ArrowDown, className: "border-sky-500/40 bg-sky-500/5 text-sky-700 dark:text-sky-400" },
  align: { icon: ArrowLeftRight, className: "border-sky-500/40 bg-sky-500/5 text-sky-700 dark:text-sky-400" },
  ok: { icon: Check, className: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" },
};

export function ScreenSchedulePanel({ screen, stats }: { screen: Screen; stats: ScreenStats }) {
  const { board, canEdit } = usePantallas();
  const updateScreen = useUpdateScreen();
  const updateSettings = useUpdatePantallasSettings();
  const { settings } = board;

  function saveSchedule(turnOnAt: string, turnOffAt: string, message?: string) {
    if (turnOnAt === turnOffAt) {
      toast.error("El encendido y el apagado no pueden ser la misma hora");
      return;
    }
    updateScreen.mutate(
      { id: screen.id, turnOnAt, turnOffAt },
      {
        onSuccess: () => {
          if (message) toast.success(message);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function saveMinHours(raw: string) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0 || value > 24 || value === settings.minHours) return;
    updateSettings.mutate(
      { minHours: value },
      {
        onSuccess: () => toast.success(`Mínimo de operación: ${formatHours(value)}`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted-foreground">Horario de operación</span>
        <span className="text-sm font-semibold">
          {formatClock12(screen.turnOnAt)} — {formatClock12(screen.turnOffAt)} ·{" "}
          {formatHours(stats.hours)} · {formatCount(stats.capacity)} spots
        </span>
      </div>
    );
  }

  const presets = [...new Set([settings.minHours, ...DURATION_PRESETS])].sort((a, b) => a - b);
  const onMinutes = minutesOf(screen.turnOnAt) ?? 0;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <TimePicker
        className="w-32"
        label="Enciende"
        step={30}
        value={screen.turnOnAt}
        onChange={(value) => saveSchedule(value, screen.turnOffAt)}
      />
      <TimePicker
        className="w-32"
        label="Apaga"
        step={30}
        value={screen.turnOffAt}
        onChange={(value) => saveSchedule(screen.turnOnAt, value)}
      />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Duración</span>
        <div className="flex flex-wrap gap-1">
          {presets.map((hours) => (
            <Button
              key={hours}
              type="button"
              sizeVariant="md"
              variant={Math.abs(stats.hours - hours) < 0.01 ? "default" : "outline"}
              onClick={() => saveSchedule(screen.turnOnAt, toHHMM(onMinutes + hours * 60))}
            >
              {formatShortHours(hours)}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-24" title="Se aplica a todas las pantallas">
        <Input
          key={settings.minHours}
          label="Mínimo (h)"
          type="number"
          min={1}
          max={24}
          step={0.5}
          defaultValue={settings.minHours}
          onBlur={(e) => saveMinHours(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveMinHours(e.currentTarget.value);
          }}
        />
      </div>
      <div className="flex flex-col pb-0.5">
        <b className="text-sm">{formatHours(stats.hours)}</b>
        <small className="text-xs text-muted-foreground">{formatCount(stats.capacity)} spots</small>
      </div>
    </div>
  );
}

export function ScheduleSuggestionBanner({ screen, stats }: { screen: Screen; stats: ScreenStats }) {
  const { board } = usePantallas();
  const updateScreen = useUpdateScreen();
  const suggestion = scheduleSuggestion(screen, stats, board.settings);
  const style = SUGGESTION_STYLE[suggestion.type];
  const Icon = suggestion.title.startsWith("No alcanza") ? TriangleAlert : style.icon;

  function apply() {
    if (!suggestion.turnOnAt || !suggestion.turnOffAt) return;
    const on = suggestion.turnOnAt;
    const off = suggestion.turnOffAt;
    updateScreen.mutate(
      { id: screen.id, turnOnAt: on, turnOffAt: off },
      {
        onSuccess: () =>
          toast.success(`Horario actualizado · ${formatClock12(on)} a ${formatClock12(off)}`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5", style.className)}>
      <Icon className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{suggestion.title}</p>
        <p className="text-xs text-foreground/70">{suggestion.detail}</p>
      </div>
      {suggestion.type !== "ok" ? (
        <Button sizeVariant="sm" disabled={updateScreen.isPending} onClick={apply}>
          Aplicar
        </Button>
      ) : null}
    </div>
  );
}
