"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { DigitalBillboard } from "@/api/digital-billboards/digital-billboards.get";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemDateRangeCell } from "@/components/pages/static-billboards/quotation/item-date-range-cell";
import { NumericCellInput } from "@/components/pages/static-billboards/quotation/numeric-cell-input";
import {
  ALLOWED_SPOT_COUNTS,
  applyDigitalItemDateRange,
  calculateDigitalRentalPrice,
  calculateInclusiveDays,
  digitalBillboardToOfferItem,
  type AllowedSpotCount,
  type DigitalOfferItem,
} from "./offer-types";
import { DigitalBillboardPicker } from "./digital-billboard-picker";

export interface DigitalItemsSectionProps {
  items: DigitalOfferItem[];
  onChange: (items: DigitalOfferItem[]) => void;
}

export function DigitalItemsSection({
  items,
  onChange,
}: DigitalItemsSectionProps) {
  const selectedIds = useMemo(
    () => new Set(items.map((item) => item.digitalBillboardId)),
    [items],
  );

  function handleAdd(billboard: DigitalBillboard) {
    onChange([...items, digitalBillboardToOfferItem(billboard)]);
  }

  function handleRemove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function updateItem<K extends keyof DigitalOfferItem>(
    id: string,
    key: K,
    value: DigitalOfferItem[K],
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
        const days = calculateInclusiveDays(item.startDate, item.endDate);
        const unitPrice = days > 0 ? Math.max(0, rentalPrice / days) : rentalPrice;
        return { ...item, rentalPrice, unitPrice };
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
          ? applyDigitalItemDateRange(item, range.startDate, range.endDate)
          : item,
      ),
    );
  }

  function updateSpotCount(id: string, value: AllowedSpotCount) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, spotCount: value } : item)),
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          Vallas digitales ({items.length})
        </h3>
        <div className="w-72 max-w-full">
          <DigitalBillboardPicker
            selectedIds={selectedIds}
            onSelect={handleAdd}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aún no has agregado vallas digitales.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">Código</th>
                <th className="px-2 py-2 text-left">Ubicación</th>
                <th className="px-2 py-2 text-right">Cant.</th>
                <th className="px-2 py-2 text-right">Spots/día</th>
                <th className="px-2 py-2 text-right">Arrendamiento</th>
                <th className="px-2 py-2 text-left">Duración</th>
                <th className="px-1 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <DigitalItemRow
                  key={item.id}
                  item={item}
                  onChangeQuantity={(qty) =>
                    updateItem(item.id, "quantity", qty)
                  }
                  onChangeSpotCount={(value) => updateSpotCount(item.id, value)}
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

interface DigitalItemRowProps {
  item: DigitalOfferItem;
  onChangeQuantity: (value: number) => void;
  onChangeSpotCount: (value: AllowedSpotCount) => void;
  onChangeRental: (value: number) => void;
  onChangeDateRange: (range: {
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  onRemove: () => void;
}

function DigitalItemRow({
  item,
  onChangeQuantity,
  onChangeSpotCount,
  onChangeRental,
  onChangeDateRange,
  onRemove,
}: DigitalItemRowProps) {
  const days = calculateInclusiveDays(item.startDate, item.endDate);
  const rentalBreakdown =
    days === 1 ? "× 1 día" : `× ${days} días`;

  return (
    <tr className="border-t">
      <td className="px-2 py-1.5 font-medium">{item.billboardCode ?? "—"}</td>
      <td className="max-w-[240px] px-2 py-1.5 text-muted-foreground">
        <p className="truncate font-medium text-foreground">{item.name}</p>
        <p className="mt-0.5 truncate text-xs">
          {item.address ?? "—"}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground/80">
          {rentalBreakdown}
        </p>
      </td>
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
        <Select
          value={String(item.spotCount)}
          onValueChange={(v) => onChangeSpotCount(Number(v) as AllowedSpotCount)}
        >
          <SelectTrigger className="h-7 w-[88px] text-xs tabular-nums">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALLOWED_SPOT_COUNTS.map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          aria-label={`Quitar valla digital ${item.billboardCode ?? ""}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  );
}

export { calculateDigitalRentalPrice };
