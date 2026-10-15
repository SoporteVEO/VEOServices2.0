"use client";

import { Lock, Plus } from "lucide-react";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { HOLD_DAY_OPTIONS } from "../crm-ooh-const";

export interface HoldOptions {
  hold: boolean;
  holdDays: number;
}

interface Props {
  count: number;
  total: number;
  hold: HoldOptions;
  onHoldChange: (hold: HoldOptions) => void;
  onSubmit: () => void;
  pending: boolean;
  disabled?: boolean;
  onClear: () => void;
}

export function CrmInventorySelectionBar({
  count,
  total,
  hold,
  onHoldChange,
  onSubmit,
  pending,
  disabled = false,
  onClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-sm">
        <span>
          <span className="font-semibold tabular-nums">{count}</span> seleccionados
        </span>
        <span className="text-muted-foreground">
          ≈ <span className="font-semibold text-foreground tabular-nums">{formatMoney(total)}</span>{" "}
          en el periodo
        </span>
        {count > 0 ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={onClear}
          >
            Limpiar
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="inventory-hold"
            checked={hold.hold}
            onCheckedChange={(checked) => onHoldChange({ ...hold, hold: checked })}
          />
          <Label htmlFor="inventory-hold" className="text-xs">
            Reservar por
          </Label>
          <Select
            value={String(hold.holdDays)}
            disabled={!hold.hold}
            onValueChange={(days) => onHoldChange({ ...hold, holdDays: Number(days) })}
          >
            <SelectTrigger sizeVariant="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOLD_DAY_OPTIONS.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  {days} días
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          icon={hold.hold ? Lock : Plus}
          disabled={disabled || count === 0}
          loading={pending}
          onClick={onSubmit}
        >
          {hold.hold ? "Reservar sitios" : "Agregar a propuesta"}
        </Button>
      </div>
    </div>
  );
}
