"use client";

import type { PantallasBoard } from "@/api/pantallas/pantallas.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EMPTY_ORDER_ROW, OrderIntakeRow, type OrderRowState } from "../pantallas/order-intake-row";
import { ORDER_SPOT_PRESETS } from "../pantallas/pantallas-const";
import {
  formatCount,
  formatMoney,
  parseAmount,
  plural,
} from "../pantallas/pantallas-format";
import { exactSpotValue, type PlacementInput } from "../pantallas/pantallas-logic";
import type { draftTotals } from "./pantallas-orders-logic";

export function OrderSaveScreens({
  board,
  refDate,
  rows,
  base,
  startDate,
  endDate,
  totals,
  monthlyOverride,
  onMonthlyOverrideChange,
  onPatchRow,
  onApplyToAll,
}: {
  board: PantallasBoard;
  refDate: string;
  rows: Record<string, OrderRowState>;
  base: Omit<PlacementInput, "spotsPerDay">;
  startDate: string | null;
  endDate: string | null;
  totals: ReturnType<typeof draftTotals>;
  monthlyOverride: string;
  onMonthlyOverrideChange: (value: string) => void;
  onPatchRow: (screenId: string, patch: Partial<OrderRowState>) => void;
  onApplyToAll: (spots: number) => void;
}) {
  const withoutValue = totals.active.length - totals.withValue;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Pantallas · spots por día, valor de la pantalla y costo por spot
        </p>
        {board.screens.map((screen) => {
          const row = rows[screen.id] ?? EMPTY_ORDER_ROW;
          return (
            <OrderIntakeRow
              key={screen.id}
              screen={screen}
              row={row}
              autoSpot={exactSpotValue(parseAmount(row.monthly), row.spots, startDate, endDate)}
              base={base}
              settings={board.settings}
              refDate={refDate}
              onChange={(patch) => onPatchRow(screen.id, patch)}
            />
          );
        })}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          Aplicar a todas:
          {[...ORDER_SPOT_PRESETS, 0].map((value) => (
            <Button
              key={value}
              type="button"
              variant="outline"
              sizeVariant="sm"
              onClick={() => onApplyToAll(value)}
            >
              {value ? formatCount(value) : "limpiar"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid items-end gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm sm:grid-cols-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Spots en la vigencia</span>
          <b>{formatCount(totals.spots)}</b>
          <span className="text-xs text-muted-foreground">
            {totals.active.length} {plural(totals.active.length, "pantalla")} · {formatCount(totals.days)}{" "}
            días
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Valor total</span>
          <b>{formatMoney(totals.total)}</b>
          <span className="text-xs text-muted-foreground">
            {withoutValue > 0 ? `${withoutValue} sin valor` : "suma de las pantallas"}
          </span>
        </div>
        <Input
          label="Valor mensual"
          type="number"
          min={0}
          step={0.01}
          placeholder={totals.total ? `${formatMoney(totals.total)} (igual al total)` : "igual al total"}
          value={monthlyOverride}
          onChange={(e) => onMonthlyOverrideChange(e.target.value)}
        />
      </div>
    </div>
  );
}
