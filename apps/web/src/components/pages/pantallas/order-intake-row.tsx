"use client";

import type { CampaignDeal, PantallasSettings, Screen } from "@/api/pantallas/pantallas.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DEAL_OPTIONS, DEAL_SHORT_LABELS, ORDER_SPOT_PRESETS } from "./pantallas-const";
import { formatCount } from "./pantallas-format";
import { describePlan, planPlacement, type PlacementInput } from "./pantallas-logic";

export interface OrderRowState {
  spots: number;
  monthly: string;
  spotInput: string;
  spotTouched: boolean;
  deal: CampaignDeal;
}

export const EMPTY_ORDER_ROW: OrderRowState = {
  spots: 0,
  monthly: "",
  spotInput: "",
  spotTouched: false,
  deal: "COMMERCIAL",
};

export function OrderIntakeRow({
  screen,
  row,
  autoSpot,
  base,
  settings,
  refDate,
  onChange,
}: {
  screen: Screen;
  row: OrderRowState;
  autoSpot: number | null;
  base: Omit<PlacementInput, "spotsPerDay">;
  settings: PantallasSettings;
  refDate: string;
  onChange: (patch: Partial<OrderRowState>) => void;
}) {
  const active = row.spots > 0;
  const plan = active ? planPlacement(screen, { ...base, spotsPerDay: row.spots }, settings, refDate) : null;
  const presets = ORDER_SPOT_PRESETS.includes(row.spots) || !active
    ? ORDER_SPOT_PRESETS
    : [...ORDER_SPOT_PRESETS, row.spots];
  const spotDisplay = row.spotTouched ? row.spotInput : autoSpot !== null ? String(autoSpot) : "";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
        active && "border-primary/40 bg-primary/5",
        plan?.type === "new" && "border-amber-500/50 bg-amber-500/5",
        plan?.type === "duplicate" && "border-red-500/40 bg-red-500/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-36 flex-1">
          <p className="text-sm font-semibold">{screen.name}</p>
          <p className="text-xs text-muted-foreground">
            {plan ? describePlan(plan, true) : "no va en esta pantalla"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {presets.map((value) => (
            <Button
              key={value}
              type="button"
              sizeVariant="sm"
              variant={row.spots === value ? "default" : "outline"}
              onClick={() => onChange({ spots: row.spots === value ? 0 : value })}
            >
              {formatCount(value)}
            </Button>
          ))}
        </div>
      </div>
      <div className={cn("grid gap-2 sm:grid-cols-3", !active && "pointer-events-none opacity-50")}>
        <Input
          label="$ mes"
          type="number"
          min={0}
          step={0.01}
          placeholder="0.00"
          disabled={!active}
          value={row.monthly}
          onChange={(e) => onChange({ monthly: e.target.value })}
        />
        <Input
          label="$ spot"
          type="number"
          min={0}
          step={0.0001}
          placeholder="0.0000"
          disabled={!active}
          value={spotDisplay}
          onChange={(e) =>
            onChange({ spotInput: e.target.value, spotTouched: e.target.value !== "" })
          }
        />
        <Select
          label="Modalidad"
          disabled={!active}
          value={row.deal}
          onValueChange={(value) => onChange({ deal: value as CampaignDeal })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEAL_OPTIONS.map((deal) => (
              <SelectItem key={deal} value={deal}>
                {DEAL_SHORT_LABELS[deal]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
