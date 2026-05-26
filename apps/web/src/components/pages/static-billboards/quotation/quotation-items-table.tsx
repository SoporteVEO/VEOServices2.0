"use client";

import { useMemo } from "react";
import { formatMoney } from "@/lib/format";
import type { ContractRange } from "../detail/billboard-detail-utils";
import { QuotationItemRow } from "./quotation-item-row";
import {
  IVA_RATE,
  calculateRentalMonths,
  calculateRentalPrice,
  computeQuotationTotals,
  formatRentalSubtotalPeriodsHint,
  type QuotationItem,
} from "./quotation-types";

export interface QuotationItemsTableProps {
  items: QuotationItem[];
  contractRangesByBillboardId?: Map<number, ContractRange[]>;
  onChange: (items: QuotationItem[]) => void;
}

export function QuotationItemsTable({
  items,
  contractRangesByBillboardId,
  onChange,
}: QuotationItemsTableProps) {
  const totals = useMemo(() => computeQuotationTotals(items), [items]);
  const rentalPeriodsHint = useMemo(
    () => formatRentalSubtotalPeriodsHint(items),
    [items],
  );

  function updateItem<K extends keyof QuotationItem>(
    id: string,
    key: K,
    value: QuotationItem[K],
  ) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }

  function updateDateRange(
    id: string,
    range: { startDate: Date | null; endDate: Date | null },
  ) {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          startDate: range.startDate,
          endDate: range.endDate,
          rentalPrice: calculateRentalPrice(
            item.monthlyRentalPrice,
            range.startDate,
            range.endDate,
          ),
        };
      }),
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

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">
          Vallas seleccionadas ({items.length})
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay vallas en la cotización.
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
                <QuotationItemRow
                  key={item.id}
                  item={item}
                  occupiedRanges={
                    contractRangesByBillboardId?.get(item.billboardId) ?? []
                  }
                  onChangeQuantity={(qty) =>
                    updateItem(item.id, "quantity", qty)
                  }
                  onChangeImpression={(value) =>
                    updateItem(item.id, "impressionPrice", value)
                  }
                  onChangeRental={(value) => updateRentalPrice(item.id, value)}
                  onChangeDateRange={(range) => updateDateRange(item.id, range)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </tbody>
            <tfoot className="bg-muted/40 text-xs">
              <tr>
                <td colSpan={3} className="px-2 py-1.5"></td>
                <td className="px-2 py-1.5 text-right font-medium">Subtotal</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {formatMoney(totals.subtotalImpression)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  <div>{formatMoney(totals.subtotalRental)}</div>
                  {rentalPeriodsHint ? (
                    <div className="mt-0.5 font-normal text-muted-foreground">
                      {rentalPeriodsHint}
                    </div>
                  ) : null}
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={3} className="px-2 py-1.5"></td>
                <td className="px-2 py-1.5 text-right font-medium">
                  IVA ({Math.round(IVA_RATE * 100)}%)
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {formatMoney(totals.ivaImpression)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {formatMoney(totals.ivaRental)}
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr className="border-t">
                <td colSpan={3} className="px-2 py-1.5"></td>
                <td className="px-2 py-1.5 text-right font-semibold">Total</td>
                <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                  {formatMoney(totals.totalImpression)}
                </td>
                <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                  {formatMoney(totals.totalRental)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
