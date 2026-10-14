"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCreateSublist, useMoveCampaign } from "@/api/pantallas/pantallas.mutations";
import type { Screen, Sublist } from "@/api/pantallas/pantallas.types";
import { Card, CardContent } from "@/components/primitives/ui/card";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { FULL_SUBLIST_SPOTS, HALF_SUBLIST_SPOTS, SCREEN_CHANGE_LABELS } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import {
  formatClock12,
  formatCount,
  formatHours,
  formatTimestamp,
  minutesOf,
} from "./pantallas-format";
import { findLocation, screenStats, sublistStats } from "./pantallas-logic";
import type { DraggedCampaign } from "./campaign-card";
import { OccupancyBar } from "./occupancy-bar";
import { ScheduleSuggestionBanner, ScreenSchedulePanel } from "./screen-schedule-panel";
import { StatusLegend } from "./status-legend";
import { SublistCard } from "./sublist-card";

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-semibold tabular-nums", className)}>{value}</span>
    </div>
  );
}

type OverflowConfirm = { title: string; description: string } & (
  | { kind: "sublist"; capacity: number }
  | { kind: "move"; drag: DraggedCampaign; target: Sublist }
);

export function ScreenView({ screen }: { screen: Screen }) {
  const { board, refDate, canEdit, openDialog } = usePantallas();
  const [hideFinished, setHideFinished] = useState(false);
  const [dragging, setDragging] = useState<DraggedCampaign | null>(null);
  const [overflow, setOverflow] = useState<OverflowConfirm | null>(null);
  const createSublist = useCreateSublist();
  const moveCampaign = useMoveCampaign();

  const stats = screenStats(screen, board.settings, refDate);
  const fitting = Math.floor(stats.capacity / FULL_SUBLIST_SPOTS);
  const remainder = stats.capacity - fitting * FULL_SUBLIST_SPOTS;
  const overnight = (minutesOf(screen.turnOffAt) ?? 0) <= (minutesOf(screen.turnOnAt) ?? 0);

  function createSublistNow(capacity: number) {
    createSublist.mutate(
      { screenId: screen.id, capacity },
      {
        onSuccess: () => toast.success("Sublista agregada"),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function addSublist(capacity: number) {
    const listed = screen.sublists.reduce((sum, s) => sum + s.capacity, 0);
    if (listed + capacity > stats.capacity) {
      setOverflow({
        kind: "sublist",
        capacity,
        title: "¿Agregar la sublista de todos modos?",
        description: `Con esta sublista las listas suman ${formatCount(listed + capacity)} spots y la pantalla solo tiene ${formatCount(stats.capacity)} (${formatHours(stats.hours)}). Sube las horas al aire o agrégala de todos modos.`,
      });
      return;
    }
    createSublistNow(capacity);
  }

  function handleDrop(target: Sublist) {
    const drag = dragging;
    setDragging(null);
    if (!drag) return;
    const location = findLocation(board, drag.campaignId);
    if (!location) return;
    const free = sublistStats(target, refDate).free;
    if (drag.spotsPerDay > free) {
      setOverflow({
        kind: "move",
        drag,
        target,
        title: "¿Mover la campaña de todos modos?",
        description: `${location.campaign.client} lleva ${formatCount(drag.spotsPerDay)} spots y en ${target.name} solo quedan ${formatCount(free)} libres.`,
      });
      return;
    }
    moveCampaignNow(drag, target);
  }

  function moveCampaignNow(drag: DraggedCampaign, target: Sublist) {
    const location = findLocation(board, drag.campaignId);
    if (!location) return;
    moveCampaign.mutate(
      { id: drag.campaignId, sublistId: target.id },
      {
        onSuccess: () =>
          toast.success(`${location.campaign.client}: ${location.sublist.name} → ${target.name}`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm" className="border py-4 shadow-none ring-0">
        <CardContent className="flex flex-col gap-4 px-4 py-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{screen.name}</h2>
              {screen.lastChange?.client ? (
                <p className="text-xs text-muted-foreground">
                  Último cambio: <b className="text-foreground">{screen.lastChange.client}</b>{" "}
                  {SCREEN_CHANGE_LABELS[screen.lastChange.action] ?? screen.lastChange.action}
                  {screen.lastChange.at ? ` · ${formatTimestamp(screen.lastChange.at)}` : ""}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sin cambios registrados en esta pantalla
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {canEdit ? (
                <Button
                  variant="outline"
                  sizeVariant="sm"
                  icon={Pencil}
                  onClick={() => openDialog({ type: "screen", screenId: screen.id })}
                >
                  Editar pantalla
                </Button>
              ) : null}
              <Switch
                id={`hide-finished-${screen.id}`}
                checked={hideFinished}
                onCheckedChange={setHideFinished}
              />
              <Label htmlFor={`hide-finished-${screen.id}`} className="text-xs">
                Ocultar finalizadas
                {stats.byStatus.FINISHED ? ` (${stats.byStatus.FINISHED})` : ""}
              </Label>
            </div>
          </div>

          <ScreenSchedulePanel screen={screen} stats={stats} />
          <OccupancyBar pct={stats.pct} className="h-2.5" />

          <div className="grid grid-cols-2 gap-3 @xl/main:grid-cols-4 @5xl/main:grid-cols-7">
            <Metric
              label="Ocupación"
              value={`${stats.pct.toFixed(1)}%`}
              className={stats.pct > 100.5 ? "text-red-600" : stats.pct >= 90 ? "text-amber-600" : undefined}
            />
            <Metric label="Spots al aire" value={formatCount(stats.used)} />
            <Metric
              label="Spots libres"
              value={formatCount(stats.free)}
              className={stats.free < 0 ? "text-red-600" : undefined}
            />
            <Metric
              label="Pausados"
              value={formatCount(stats.pausedSpots)}
              className={stats.pausedSpots ? "text-violet-600 dark:text-violet-400" : undefined}
            />
            <Metric label="Capacidad" value={formatCount(stats.capacity)} />
            <Metric
              label="Sublistas"
              value={
                <>
                  {screen.sublists.length}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {fitting}
                    {remainder ? "+" : ""}
                  </span>
                </>
              }
            />
            <Metric
              label="Al aire · vencen"
              value={
                <>
                  {stats.byStatus.ACTIVE + stats.byStatus.EXPIRING}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    · {stats.byStatus.EXPIRING}
                  </span>
                </>
              }
            />
          </div>

          {canEdit ? (
            <>
              <ScheduleSuggestionBanner screen={screen} stats={stats} />
              <p className="text-xs text-muted-foreground">
                Enciende a las {formatClock12(screen.turnOnAt)} y apaga a las{" "}
                {formatClock12(screen.turnOffAt)}
                {overnight ? " del día siguiente" : ""} · {formatHours(stats.hours)} ×{" "}
                {board.settings.spotsPerHour} spots/h = {formatCount(stats.capacity)} reproducciones ·
                caben {fitting} sublistas de {FULL_SUBLIST_SPOTS}
                {remainder ? ` + ${formatCount(remainder)} spots extra` : ""}.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 @3xl/main:grid-cols-2 @7xl/main:grid-cols-3 @[96rem]/main:grid-cols-4">
        {screen.sublists.map((sublist) => (
          <SublistCard
            key={sublist.id}
            sublist={sublist}
            hideFinished={hideFinished}
            dragging={dragging}
            onDragStart={setDragging}
            onDragEnd={() => setDragging(null)}
            onDropCampaign={handleDrop}
          />
        ))}
      </div>

      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <Button
            icon={Plus}
            disabled={createSublist.isPending}
            onClick={() => addSublist(FULL_SUBLIST_SPOTS)}
          >
            Sublista de {FULL_SUBLIST_SPOTS} spots
          </Button>
          <Button
            variant="outline"
            icon={Plus}
            disabled={createSublist.isPending}
            onClick={() => addSublist(HALF_SUBLIST_SPOTS)}
          >
            Sublista extra de {HALF_SUBLIST_SPOTS}
          </Button>
        </div>
      ) : null}
      <StatusLegend />

      <ConfirmDialog
        open={overflow !== null}
        onOpenChange={(open) => {
          if (!open) setOverflow(null);
        }}
        title={overflow?.title ?? ""}
        description={overflow?.description}
        confirmLabel={overflow?.kind === "move" ? "Mover igual" : "Agregar igual"}
        variant="default"
        onConfirm={() => {
          if (!overflow) return;
          if (overflow.kind === "sublist") createSublistNow(overflow.capacity);
          else moveCampaignNow(overflow.drag, overflow.target);
          setOverflow(null);
        }}
      />
    </div>
  );
}
