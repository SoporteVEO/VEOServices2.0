"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { ItemDateRangeCell } from "@/components/pages/static-billboards/quotation/item-date-range-cell";
import { NumericCellInput } from "@/components/pages/static-billboards/quotation/numeric-cell-input";
import {
  applyStaticItemDateRange,
  calculateRentalMonths,
  calculateStaticRentalPrice,
  formatRentalPeriodMultiplier,
  staticBillboardToOfferItem,
  type StaticOfferItem,
} from "./offer-types";
import { StaticBillboardPicker } from "./static-billboard-picker";

export interface StaticItemsSectionProps {
  items: StaticOfferItem[];
  onChange: (items: StaticOfferItem[]) => void;
}

export function StaticItemsSection({
  items,
  onChange,
}: StaticItemsSectionProps) {
  const selectedIds = useMemo(
    () => new Set(items.map((item) => item.billboardId)),
    [items],
  );

  function handleAdd(billboard: AvailableBillboardListing) {
    onChange([...items, staticBillboardToOfferItem(billboard)]);
  }

  function handleRemove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function updateItem<K extends keyof StaticOfferItem>(
    id: string,
    key: K,
    value: StaticOfferItem[K],
  ) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }

  function updateRentalPrice(id: string, totalRental: number) {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const rentalPrice = Math.max(0, totalRental);
        const months = calculateRentalMonths(item.startDate, item.endDate);
        const monthlyRentalPrice =
          months > 0 ? Math.max(0, rentalPrice / months) : rentalPrice;
        return { ...item, rentalPrice, monthlyRentalPrice };
      }),
    );
  }

  function updateDateRange(
    id: string,
    range: { startDate: Date | null; endDate: Date | null },
  ) {
    onChange(
      items.map((item) =>
        item.id === id
          ? applyStaticItemDateRange(item, range.startDate, range.endDate)
          : item,
      ),
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          Vallas estáticas ({items.length})
        </h3>
        <div className="w-72 max-w-full">
          <StaticBillboardPicker
            selectedIds={selectedIds}
            onSelect={handleAdd}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aún no has agregado vallas estáticas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">Código</th>
                <th className="px-2 py-2 text-left">Ubicación</th>
                <th className="px-2 py-2 text-right">Medida</th>
                <th className="px-2 py-2 text-right">Cant.</th>
                <th className="px-2 py-2 text-right">Impresión</th>
                <th className="px-2 py-2 text-right">Arrendamiento</th>
                <th className="px-2 py-2 text-left">Duración</th>
                <th className="px-1 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <StaticItemRow
                  key={item.id}
                  item={item}
                  onChangeQuantity={(qty) => updateItem(item.id, "quantity", qty)}
                  onChangeImpression={(value) =>
                    updateItem(item.id, "impressionPrice", value)
                  }
                  onChangeRental={(value) => updateRentalPrice(item.id, value)}
                  onChangeDateRange={(range) => updateDateRange(item.id, range)}
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

interface StaticItemRowProps {
  item: StaticOfferItem;
  onChangeQuantity: (value: number) => void;
  onChangeImpression: (value: number) => void;
  onChangeRental: (value: number) => void;
  onChangeDateRange: (range: {
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  onRemove: () => void;
}

function StaticItemRow({
  item,
  onChangeQuantity,
  onChangeImpression,
  onChangeRental,
  onChangeDateRange,
  onRemove,
}: StaticItemRowProps) {
  const dims =
    item.width != null && item.height != null
      ? `${item.width.toFixed(2)} × ${item.height.toFixed(2)}`
      : "—";

  const rentalPeriods = calculateRentalMonths(item.startDate, item.endDate);
  const rentalBreakdown = (() => {
    const multiplier = formatRentalPeriodMultiplier(rentalPeriods);
    const periodLabel =
      rentalPeriods === 1 ? "período de 30 días" : "períodos de 30 días";
    return `${formatMoney(item.monthlyRentalPrice)} ${multiplier} ${periodLabel}`;
  })();

  return (
    <tr className="border-t">
      <td className="px-2 py-1.5 font-medium">{item.billboardCode ?? "—"}</td>
      <td className="max-w-[240px] px-2 py-1.5 text-muted-foreground">
        <p className="truncate">{item.description}</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground/80">
          Arrend. {rentalBreakdown}
        </p>
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums">{dims}</td>
      <td className="px-2 py-1.5 text-right">
        <NumericCellInput
          value={item.quantity}
          min={1}
          step={1}
          className="h-7 w-16 rounded-md text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 bg-input px-2 py-1.5 border border-border shadow-sm"
          onChange={(v) => onChangeQuantity(Math.max(1, Math.round(v)))}
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        <NumericCellInput
          value={item.impressionPrice}
          min={0}
          step={0.01}
          onChange={(v) => onChangeImpression(Math.max(0, v))}
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        <NumericCellInput
          value={item.rentalPrice}
          min={0}
          step={0.01}
          onChange={(v) => onChangeRental(Math.max(0, v))}
        />
      </td>
      <td className="px-2 py-1.5">
        <div className="w-[170px]">
          <ItemDateRangeCell
            startDate={item.startDate}
            endDate={item.endDate}
            onChange={onChangeDateRange}
          />
        </div>
      </td>
      <td className="px-1 py-1.5 text-right">
        <Button
          type="button"
          variant="ghost"
          sizeVariant="sm"
          className="size-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={`Quitar valla ${item.billboardCode ?? ""}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  );
}

// re-export so it can be used in totals
export { calculateStaticRentalPrice };
