"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { CrmStageKind } from "@/api/crm/crm.types";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Input as PrimitiveInput } from "@/components/primitives/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STAGE_COLOR_PALETTE } from "../crm-const";

export interface StageDraft {
  uid: string;
  id?: string;
  name: string;
  color: string;
  probability: string;
  kind: CrmStageKind;
  rottingDays: string;
  /** Deals currently in the stage; such stages can't be removed or change kind. */
  lockedDeals: number;
}

const KIND_LABELS: Record<CrmStageKind, string> = {
  OPEN: "Abierta",
  WON: "Ganado",
  LOST: "Perdido",
};

interface Props {
  stages: StageDraft[];
  onChange: (stages: StageDraft[]) => void;
}

export function CrmStageEditor({ stages, onChange }: Props) {
  function update(uid: string, patch: Partial<StageDraft>) {
    onChange(stages.map((stage) => (stage.uid === uid ? { ...stage, ...patch } : stage)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden grid-cols-[2rem_1fr_5.5rem_7.5rem_6rem_5.5rem] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:grid">
        <span />
        <span>Etapa</span>
        <span>Prob. %</span>
        <span>Tipo</span>
        <span>Días alerta</span>
        <span />
      </div>
      {stages.map((stage, index) => (
        <div
          key={stage.uid}
          className="grid grid-cols-[2rem_1fr] items-center gap-2 border border-border p-2 md:grid-cols-[2rem_1fr_5.5rem_7.5rem_6rem_5.5rem] md:border-0 md:p-0"
        >
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Color de la etapa"
                className="size-7 cursor-pointer rounded-md border border-border"
                style={{ backgroundColor: stage.color }}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-4 gap-1.5">
                {STAGE_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => update(stage.uid, { color })}
                    className={cn(
                      "size-7 cursor-pointer rounded-md border border-border",
                      stage.color === color && "ring-2 ring-ring ring-offset-1",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <PrimitiveInput
            aria-label="Nombre de la etapa"
            value={stage.name}
            placeholder="Nombre"
            onChange={(e) => update(stage.uid, { name: e.target.value })}
          />
          <PrimitiveInput
            aria-label="Probabilidad"
            type="number"
            min={0}
            max={100}
            value={stage.kind === "OPEN" ? stage.probability : stage.kind === "WON" ? "100" : "0"}
            disabled={stage.kind !== "OPEN"}
            onChange={(e) => update(stage.uid, { probability: e.target.value })}
            className="col-start-2 md:col-start-auto"
          />
          <Select
            value={stage.kind}
            disabled={stage.lockedDeals > 0}
            onValueChange={(kind) => update(stage.uid, { kind: kind as CrmStageKind })}
          >
            <SelectTrigger className="col-start-2 w-full md:col-start-auto" sizeVariant="md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(KIND_LABELS) as CrmStageKind[]).map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PrimitiveInput
            aria-label="Días sin actividad para alertar"
            type="number"
            min={1}
            max={365}
            placeholder="—"
            value={stage.kind === "OPEN" ? stage.rottingDays : ""}
            disabled={stage.kind !== "OPEN"}
            onChange={(e) => update(stage.uid, { rottingDays: e.target.value })}
            className="col-start-2 md:col-start-auto"
          />
          <div className="col-start-2 flex items-center justify-end gap-0.5 md:col-start-auto">
            <PrimitiveButton
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Subir"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp />
            </PrimitiveButton>
            <PrimitiveButton
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Bajar"
              disabled={index === stages.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown />
            </PrimitiveButton>
            <PrimitiveButton
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Eliminar etapa"
              title={stage.lockedDeals > 0 ? `Tiene ${stage.lockedDeals} negocios` : undefined}
              disabled={stage.lockedDeals > 0}
              onClick={() => onChange(stages.filter((s) => s.uid !== stage.uid))}
            >
              <Trash2 />
            </PrimitiveButton>
          </div>
        </div>
      ))}
    </div>
  );
}
