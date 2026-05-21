"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemDateRangeCell } from "./item-date-range-cell";
import { NumericCellInput } from "./numeric-cell-input";
import type { QuotationItem } from "./quotation-types";

export interface QuotationItemRowProps {
  item: QuotationItem;
  onChangeQuantity: (value: number) => void;
  onChangeImpression: (value: number) => void;
  onChangeRental: (value: number) => void;
  onChangeDateRange: (range: {
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  onRemove: () => void;
}

export function QuotationItemRow({
  item,
  onChangeQuantity,
  onChangeImpression,
  onChangeRental,
  onChangeDateRange,
  onRemove,
}: QuotationItemRowProps) {
  const dims =
    item.width != null && item.height != null
      ? `${item.width.toFixed(2)} × ${item.height.toFixed(2)}`
      : "—";

  return (
    <tr className="border-t">
      <td className="px-2 py-1.5 font-medium">{item.billboardCode ?? "—"}</td>
      <td className="max-w-[240px] truncate px-2 py-1.5 text-muted-foreground">
        {item.description}
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
