"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericCellInput } from "@/components/pages/static-billboards/quotation/numeric-cell-input";
import {
  buildMiscOfferItem,
  recalculateMiscRental,
  type MiscOfferItem,
} from "./offer-types";

export interface MiscItemsSectionProps {
  items: MiscOfferItem[];
  onChange: (items: MiscOfferItem[]) => void;
}

export function MiscItemsSection({ items, onChange }: MiscItemsSectionProps) {
  function handleAdd() {
    onChange([...items, buildMiscOfferItem()]);
  }

  function handleRemove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function updateDescription(id: string, value: string) {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, description: value } : item,
      ),
    );
  }

  function updateQuantity(id: string, value: number) {
    onChange(
      items.map((item) =>
        item.id === id
          ? recalculateMiscRental(item, item.unitPrice, Math.max(1, value))
          : item,
      ),
    );
  }

  function updateUnitPrice(id: string, value: number) {
    onChange(
      items.map((item) =>
        item.id === id
          ? recalculateMiscRental(item, Math.max(0, value), item.quantity)
          : item,
      ),
    );
  }

  function updateTaxRate(id: string, value: number) {
    onChange(
      items.map((item) =>
        item.id === id
          ? { ...item, taxRate: Math.min(1, Math.max(0, value)) }
          : item,
      ),
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          Conceptos adicionales ({items.length})
        </h3>
        <Button
          type="button"
          variant="outline"
          sizeVariant="sm"
          icon={Plus}
          onClick={handleAdd}
        >
          Agregar concepto
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aún no has agregado conceptos adicionales.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">Descripción</th>
                <th className="px-2 py-2 text-right">Cantidad</th>
                <th className="px-2 py-2 text-right">Precio</th>
                <th className="px-2 py-2 text-right">Impuesto (%)</th>
                <th className="px-2 py-2 text-right">Total</th>
                <th className="px-1 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <MiscItemRow
                  key={item.id}
                  item={item}
                  onChangeDescription={(v) => updateDescription(item.id, v)}
                  onChangeQuantity={(v) => updateQuantity(item.id, v)}
                  onChangeUnitPrice={(v) => updateUnitPrice(item.id, v)}
                  onChangeTaxRate={(v) => updateTaxRate(item.id, v)}
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

interface MiscItemRowProps {
  item: MiscOfferItem;
  onChangeDescription: (value: string) => void;
  onChangeQuantity: (value: number) => void;
  onChangeUnitPrice: (value: number) => void;
  onChangeTaxRate: (value: number) => void;
  onRemove: () => void;
}

function MiscItemRow({
  item,
  onChangeDescription,
  onChangeQuantity,
  onChangeUnitPrice,
  onChangeTaxRate,
  onRemove,
}: MiscItemRowProps) {
  const lineTotal = item.rentalPrice * (1 + item.taxRate);

  return (
    <tr className="border-t align-top">
      <td className="px-2 py-1.5">
        <Input
          value={item.description}
          placeholder="Concepto, servicio o cargo adicional"
          onChange={(e) => onChangeDescription(e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        <NumericCellInput
          value={item.quantity}
          min={1}
          step={1}
          className="h-8 w-16 rounded-md text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 bg-input px-2 py-1.5 border border-border shadow-sm"
          onChange={(v) => onChangeQuantity(Math.max(1, Math.round(v)))}
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        <NumericCellInput
          value={item.unitPrice}
          min={0}
          step={0.01}
          className="h-8 w-24 rounded-md text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 bg-input px-2 py-1.5 border border-border shadow-sm"
          onChange={(v) => onChangeUnitPrice(Math.max(0, v))}
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        <NumericCellInput
          value={Math.round(item.taxRate * 10000) / 100}
          min={0}
          step={0.5}
          className="h-8 w-20 rounded-md text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 bg-input px-2 py-1.5 border border-border shadow-sm"
          onChange={(v) => onChangeTaxRate(v / 100)}
        />
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums">
        ${Number(lineTotal.toFixed(2)).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
      <td className="px-1 py-1.5 text-right">
        <Button
          type="button"
          variant="ghost"
          sizeVariant="sm"
          className="size-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label="Quitar concepto"
        >
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  );
}
